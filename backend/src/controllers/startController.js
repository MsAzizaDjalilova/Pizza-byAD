'use strict';

const { Op } = require('sequelize');
const config = require('../config/default');
const Order = require('../models/Order');
const logger = require('../utils/logger');
const { L, LANGS, resolveLang } = require('../utils/i18n');
const { INGREDIENTS, CATEGORIES, PRODUCTS, ORDER_BUMP, BADGES } = require('../config/menu');

const productById = new Map(PRODUCTS.map((p) => [p.id, p]));

/** Catalog as sent to the Mini App (all three languages; the app picks one). */
function publicCatalog() {
  return {
    categories: CATEGORIES,
    products: PRODUCTS.map(({ basePrice, ...p }) => p),
    ingredients: INGREDIENTS,
    badges: BADGES,
    orderBump: ORDER_BUMP,
    pricing: {
      currency: config.brand.currency,
      deliveryFee: config.pricing.deliveryFee,
      freeDeliveryFrom: config.pricing.freeDeliveryFrom,
    },
  };
}

class ValidationError extends Error {
  constructor(message, code = 'INVALID_CART') {
    super(message);
    this.code = code;
    this.status = 400;
  }
}

/**
 * Price a cart on the server. Never trust prices from the client.
 * @param {Array<{productId:string,size?:string,qty:number}>} rawItems
 */
function calculateOrder(rawItems, orderBump = false) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) throw new ValidationError('Cart is empty', 'EMPTY_CART');
  if (rawItems.length > 30) throw new ValidationError('Too many items');

  const items = rawItems.map((raw) => {
    const product = productById.get(String(raw?.productId));
    if (!product) throw new ValidationError('Unknown product', 'UNKNOWN_PRODUCT');
    const qty = Number(raw.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > config.pricing.maxItemQty) {
      throw new ValidationError('Invalid quantity', 'INVALID_QTY');
    }
    let unitPrice = product.price;
    let size = null;
    if (product.sizes) {
      const s = product.sizes.find((x) => x.id === raw.size);
      if (!s) throw new ValidationError('Pick a size', 'INVALID_SIZE');
      unitPrice = s.price;
      size = s.id;
    }
    return {
      productId: product.id,
      name: L(product.name, 'en'),
      size,
      unitPrice,
      qty,
      lineTotal: unitPrice * qty,
    };
  });

  if (orderBump) {
    items.push({
      productId: ORDER_BUMP.productId,
      name: `${L(productById.get(ORDER_BUMP.productId).name, 'en')} (special offer)`,
      size: null,
      unitPrice: ORDER_BUMP.price,
      qty: 1,
      lineTotal: ORDER_BUMP.price,
      isBump: true,
    });
  }

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const deliveryFee = subtotal >= config.pricing.freeDeliveryFrom ? 0 : config.pricing.deliveryFee;
  return {
    items,
    orderBumpAdded: Boolean(orderBump),
    subtotal,
    deliveryFee,
    totalAmount: subtotal + deliveryFee,
    amountToFreeDelivery: Math.max(0, config.pricing.freeDeliveryFrom - subtotal),
  };
}

function availablePaymentMethods() {
  const p = config.payments;
  return [
    { id: 'stars', title: 'Telegram Stars', emoji: '⭐️', enabled: true },
    { id: 'click', title: 'Click', emoji: '💳', enabled: Boolean(p.clickToken) },
    { id: 'payme', title: 'Payme', emoji: '💠', enabled: Boolean(p.paymeToken) },
    { id: 'crypto', title: 'Crypto (USDT/TON)', emoji: '🪙', enabled: Boolean(p.cryptoPayToken) },
  ].filter((m) => m.enabled);
}

/* ───────────────────────────── HTTP handlers ───────────────────────────── */

/** POST /api/session — called on Mini App launch. */
async function getSession(req, res) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  let ordersToday = 0;
  try {
    ordersToday = await Order.count({ where: { createdAt: { [Op.gte]: since }, status: { [Op.notIn]: ['failed', 'pending'] } } });
  } catch (err) {
    logger.warn('Could not count orders for social proof', { error: err });
  }
  res.json({
    user: {
      firstName: req.user.firstName,
      username: req.user.username,
      phone: req.user.phone,
      lastAddress: req.user.lastAddress,
      hasSeenOnboarding: req.user.hasSeenOnboarding,
      language: req.user.language || resolveLang(req.user.languageCode),
    },
    // Real count only — the Mini App hides the banner until it is meaningful
    socialProof: { ordersToday },
    paymentMethods: availablePaymentMethods(),
    support: config.telegram.supportUsername,
  });
}

/** POST /api/onboarding/complete */
async function completeOnboarding(req, res) {
  if (!req.user.hasSeenOnboarding) await req.user.update({ hasSeenOnboarding: true });
  res.json({ ok: true });
}

/** POST /api/language { language: 'uz'|'ru'|'en' } */
async function setLanguage(req, res) {
  const lang = String(req.body?.language || '');
  if (!LANGS.includes(lang)) return res.status(400).json({ error: 'INVALID_LANGUAGE' });
  await req.user.update({ language: lang });
  res.json({ ok: true, language: lang });
}

/** GET /api/catalog */
function getCatalog(_req, res) {
  res.set('Cache-Control', 'public, max-age=300');
  res.json(publicCatalog());
}

/** GET /api/orders — order history for the current user */
async function getMyOrders(req, res) {
  const orders = await Order.findAll({
    where: { userId: req.user.id, status: { [Op.ne]: 'failed' } },
    order: [['createdAt', 'DESC']],
    limit: 20,
    attributes: ['id', 'items', 'totalAmount', 'paymentMethod', 'status', 'createdAt'],
  });
  res.json({ orders });
}

module.exports = {
  ValidationError,
  calculateOrder,
  availablePaymentMethods,
  publicCatalog,
  productById,
  getSession,
  completeOnboarding,
  setLanguage,
  getCatalog,
  getMyOrders,
};
