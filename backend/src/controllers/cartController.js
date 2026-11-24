'use strict';

const crypto = require('crypto');
const config = require('../config/default');
const Order = require('../models/Order');
const User = require('../models/User');
const logger = require('../utils/logger');
const { tr, money } = require('../utils/i18n');
const { calculateOrder, availablePaymentMethods, ValidationError } = require('./startController');
const { bot, createInvoiceLink, notifyAdmin } = require('../core/bot');
const { afterPaymentKeyboard } = require('../utils/keyboards');

const PHONE_RE = /^\+?998\d{9}$/;
const normalizePhone = (p) => String(p || '').replace(/[\s\-()]/g, '');
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

/* ───────────────────────── Crypto Pay (@CryptoBot) ───────────────────────── */

const cryptoPayBase = () =>
  config.payments.cryptoPayTestnet ? 'https://testnet-pay.crypt.bot/api' : 'https://pay.crypt.bot/api';

async function cryptoPay(method, body) {
  const res = await fetch(`${cryptoPayBase()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Crypto-Pay-API-Token': config.payments.cryptoPayToken },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`CryptoPay ${method} failed: ${JSON.stringify(data.error)}`);
  return data.result;
}

async function createCryptoInvoice(order) {
  const usd = Math.max(0.1, order.totalAmount / config.payments.uzsPerUsd).toFixed(2);
  const invoice = await cryptoPay('createInvoice', {
    currency_type: 'fiat',
    fiat: 'USD',
    amount: usd,
    accepted_assets: [...new Set([config.payments.cryptoAsset, 'TON'])].join(','),
    description: `${config.brand.name} · #${order.id}`,
    payload: String(order.id),
    expires_in: 60 * 30,
  });
  return {
    link: invoice.mini_app_invoice_url || invoice.bot_invoice_url,
    invoiceId: String(invoice.invoice_id),
    chargedAmount: usd,
    currency: 'USD',
  };
}

/* ───────────────────────── Shared order state transitions ───────────────────────── */

/**
 * Mark an order as paid exactly once, then notify the customer and the kitchen.
 * Safe to call repeatedly (webhooks can be retried).
 */
async function markOrderPaid(orderId, { externalPaymentId, chargedAmount, chargedCurrency } = {}) {
  const order = await Order.findByPk(orderId, { include: [{ model: User, as: 'user' }] });
  if (!order) {
    logger.error('Payment for unknown order', { orderId });
    return null;
  }
  if (order.status !== 'pending') return order; // idempotent

  await order.update({
    status: 'paid',
    paidAt: new Date(),
    externalPaymentId: externalPaymentId ?? order.externalPaymentId,
    chargedAmount: chargedAmount ?? order.chargedAmount,
    chargedCurrency: chargedCurrency ?? order.chargedCurrency,
  });
  logger.order('order.paid', order, { externalPaymentId });

  const u = order.user;
  const lang = u.lang();
  const lines = order.items.map((i) => `• ${esc(i.name)}${i.size ? ` (${i.size})` : ''} × ${i.qty}`).join('\n');

  try {
    await bot.telegram.sendMessage(
      u.telegramId,
      tr('paid', lang, { id: order.id, lines, total: money(order.totalAmount, lang) }),
      { parse_mode: 'HTML', ...afterPaymentKeyboard(lang) }
    );
  } catch (err) {
    logger.warn('Could not message customer', { error: err, orderId: order.id });
  }

  await notifyAdmin(
    `🆕 <b>Order #${order.id}</b> — ${esc(order.paymentMethod)} ✅\n` +
      `👤 ${esc(u.firstName)}${u.username ? ` (@${esc(u.username)})` : ''} · ${lang.toUpperCase()}\n` +
      `📱 ${esc(order.phone || u.phone || '—')}\n📍 ${esc(order.address || '—')}\n` +
      (order.comment ? `💬 ${esc(order.comment)}\n` : '') +
      `\n${lines}\n` +
      (order.orderBumpAdded ? '🎁 Order bump: YES\n' : '') +
      `\n💰 <b>${money(order.totalAmount, 'en')}</b>`
  );
  return order;
}

/**
 * Validate a pre_checkout_query against the stored order.
 * Returns a localized error message, or null when the payment may proceed.
 */
async function validatePreCheckout(query) {
  const lang = query.from?.language_code;
  let orderId;
  try {
    orderId = JSON.parse(query.invoice_payload).orderId;
  } catch {
    return tr('errNotFound', lang);
  }
  const order = await Order.findByPk(orderId, { include: [{ model: User, as: 'user' }] });
  if (!order) return tr('errNotFound', lang);
  const userLang = order.user.lang();
  if (String(order.user.telegramId) !== String(query.from.id)) return tr('errNotYours', userLang);
  if (order.status !== 'pending') return tr('errNotPending', userLang);
  if (order.chargedCurrency !== query.currency || Number(order.chargedAmount) !== Number(query.total_amount)) {
    logger.warn('Pre-checkout amount mismatch', { orderId, expected: order.chargedAmount, got: query.total_amount });
    return tr('errPriceChanged', userLang);
  }
  return null;
}

/* ───────────────────────────── HTTP handlers ───────────────────────────── */

/** POST /api/cart/quote — live totals for the checkout screen. */
function quote(req, res) {
  try {
    res.json(calculateOrder(req.body?.items, Boolean(req.body?.orderBump)));
  } catch (err) {
    if (err instanceof ValidationError) return res.status(400).json({ error: err.code, message: err.message });
    throw err;
  }
}

/**
 * POST /api/orders
 * body: { items:[{productId,size,qty}], orderBump, paymentMethod, phone, address, comment }
 * → { orderId, method, invoiceLink } — the Mini App opens the link.
 * Errors return a machine code (`error`) that the Mini App translates.
 */
async function createOrder(req, res) {
  const { items, orderBump, paymentMethod, address, comment } = req.body || {};
  const phone = normalizePhone(req.body?.phone || req.user.phone);

  if (!availablePaymentMethods().some((m) => m.id === paymentMethod)) {
    return res.status(400).json({ error: 'INVALID_PAYMENT_METHOD' });
  }
  if (!PHONE_RE.test(phone)) return res.status(400).json({ error: 'INVALID_PHONE' });
  const cleanAddress = String(address || '').trim();
  if (cleanAddress.length < 5) return res.status(400).json({ error: 'INVALID_ADDRESS' });

  let calc;
  try {
    calc = calculateOrder(items, Boolean(orderBump));
  } catch (err) {
    if (err instanceof ValidationError) return res.status(400).json({ error: err.code, message: err.message });
    throw err;
  }

  const order = await Order.create({
    userId: req.user.id,
    items: calc.items,
    orderBumpAdded: calc.orderBumpAdded,
    subtotal: calc.subtotal,
    deliveryFee: calc.deliveryFee,
    totalAmount: calc.totalAmount,
    paymentMethod,
    phone,
    address: cleanAddress.slice(0, 255),
    comment: comment ? String(comment).trim().slice(0, 500) : null,
  });

  // Remember contact details for one-tap reorders
  await req.user.update({ phone, lastAddress: order.address });

  try {
    let invoice;
    if (paymentMethod === 'crypto') {
      invoice = await createCryptoInvoice(order);
      await order.update({ externalPaymentId: invoice.invoiceId });
    } else {
      invoice = await createInvoiceLink(order, paymentMethod, req.user.lang());
    }
    await order.update({ chargedAmount: invoice.chargedAmount, chargedCurrency: invoice.currency });
    logger.order('order.created', order, { bump: calc.orderBumpAdded });

    return res.status(201).json({
      orderId: order.id,
      method: paymentMethod,
      invoiceLink: invoice.link,
      totalAmount: order.totalAmount,
      chargedAmount: invoice.chargedAmount,
      chargedCurrency: invoice.currency,
    });
  } catch (err) {
    await order.update({ status: 'failed' });
    logger.error('Invoice creation failed', { error: err, orderId: order.id, method: paymentMethod });
    return res.status(502).json({ error: 'INVOICE_FAILED' });
  }
}

/** GET /api/orders/:id — polled by the Mini App after an external (crypto) payment. */
async function getOrderStatus(req, res) {
  const order = await Order.findOne({
    where: { id: Number(req.params.id) || 0, userId: req.user.id },
    attributes: ['id', 'status', 'totalAmount', 'paymentMethod', 'createdAt'],
  });
  if (!order) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json(order);
}

/**
 * POST /api/payments/crypto/webhook — Crypto Pay `invoice_paid` update.
 * Signature: HMAC_SHA256(key = SHA256(api_token), body) in `crypto-pay-api-signature`.
 */
async function cryptoWebhook(req, res) {
  const token = config.payments.cryptoPayToken;
  const signature = req.get('crypto-pay-api-signature') || '';
  if (!token || !req.rawBody) return res.sendStatus(404);

  const secret = crypto.createHash('sha256').update(token).digest();
  const expected = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
  const ok =
    signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!ok) {
    logger.warn('Rejected Crypto Pay webhook with bad signature');
    return res.sendStatus(401);
  }

  const { update_type: type, payload: invoice } = req.body || {};
  if (type === 'invoice_paid' && invoice?.status === 'paid') {
    await markOrderPaid(Number(invoice.payload), {
      externalPaymentId: String(invoice.invoice_id),
      chargedAmount: invoice.paid_amount || invoice.amount,
      chargedCurrency: invoice.paid_asset || invoice.asset || 'USD',
    });
  }
  res.json({ ok: true });
}

module.exports = { quote, createOrder, getOrderStatus, cryptoWebhook, markOrderPaid, validatePreCheckout };
