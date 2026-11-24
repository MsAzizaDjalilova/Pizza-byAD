'use strict';

const express = require('express');
const config = require('../config/default');
const logger = require('../utils/logger');
const User = require('../models/User');
const Order = require('../models/Order');
const { authMiddleware } = require('../middlewares/auth.middleware');
const start = require('../controllers/startController');
const cart = require('../controllers/cartController');
const { tr, resolveLang, LANGS } = require('../utils/i18n');
const { webAppKeyboard, supportKeyboard, languageKeyboard } = require('../utils/keyboards');

/* ═════════════════════════════ BOT HANDLERS ═════════════════════════════ */

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

function registerBotHandlers(bot) {
  // Keep the user row fresh on every private-chat update and resolve the language
  bot.use(async (ctx, next) => {
    ctx.state.lang = resolveLang(ctx.from?.language_code);
    if (ctx.from && !ctx.from.is_bot && ctx.chat?.type === 'private') {
      try {
        ctx.state.user = await User.upsertFromTelegram(ctx.from);
        ctx.state.lang = ctx.state.user.lang();
      } catch (err) {
        logger.error('User upsert failed', { error: err });
      }
    }
    return next();
  });

  bot.start(async (ctx) => {
    const lang = ctx.state.lang;
    await ctx.replyWithHTML(tr('welcome', lang, { name: esc(ctx.from.first_name) || '💕' }), webAppKeyboard(lang));
  });

  bot.command('orders', async (ctx) => {
    const lang = ctx.state.lang;
    await ctx.reply(tr('ordersHint', lang), webAppKeyboard(lang, 'myOrders', '#/orders'));
  });

  bot.command('lang', async (ctx) => ctx.reply(tr('chooseLang', ctx.state.lang), languageKeyboard()));
  bot.action('lang:menu', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(tr('chooseLang', ctx.state.lang), languageKeyboard());
  });
  bot.action(/^lang:(uz|ru|en)$/, async (ctx) => {
    const lang = ctx.match[1];
    if (ctx.state.user && LANGS.includes(lang)) await ctx.state.user.update({ language: lang });
    await ctx.answerCbQuery(tr('langSaved', lang));
    await ctx.editMessageText(tr('langSaved', lang)).catch(() => {});
    await ctx.replyWithHTML(tr('welcome', lang, { name: esc(ctx.from.first_name) || '💕' }), webAppKeyboard(lang));
  });

  bot.help(async (ctx) => ctx.reply(tr('help', ctx.state.lang), supportKeyboard(ctx.state.lang)));

  // Phone shared via WebApp.requestContact() or the reply keyboard
  bot.on('contact', async (ctx) => {
    const contact = ctx.message.contact;
    if (contact.user_id !== ctx.from.id || !ctx.state.user) return;
    const phone = contact.phone_number.startsWith('+') ? contact.phone_number : `+${contact.phone_number}`;
    await ctx.state.user.update({ phone });
    await ctx.reply(tr('phoneSaved', ctx.state.lang), { reply_markup: { remove_keyboard: true } });
  });

  // Telegram asks us to confirm the order right before charging (must answer within 10 s)
  bot.on('pre_checkout_query', async (ctx) => {
    try {
      const error = await cart.validatePreCheckout(ctx.preCheckoutQuery);
      if (error) return ctx.answerPreCheckoutQuery(false, error);
      return ctx.answerPreCheckoutQuery(true);
    } catch (err) {
      logger.error('pre_checkout_query failed', { error: err });
      return ctx.answerPreCheckoutQuery(false, tr('errTech', ctx.state.lang));
    }
  });

  bot.on('successful_payment', async (ctx) => {
    const p = ctx.message.successful_payment;
    let orderId;
    try {
      orderId = JSON.parse(p.invoice_payload).orderId;
    } catch {
      logger.error('successful_payment with bad payload', { payload: p.invoice_payload });
      return;
    }
    const phone = p.order_info?.phone_number;
    if (phone) await Order.update({ phone: `+${phone.replace(/^\+/, '')}` }, { where: { id: orderId, phone: null } });

    await cart.markOrderPaid(orderId, {
      externalPaymentId: p.telegram_payment_charge_id,
      chargedAmount: p.total_amount,
      chargedCurrency: p.currency,
    });
  });

  // Anything else → gently steer to the Mini App
  bot.on('message', async (ctx) => {
    if (ctx.chat.type !== 'private') return;
    await ctx.reply(tr('fallback', ctx.state.lang), webAppKeyboard(ctx.state.lang));
  });
}

/* ═════════════════════════════ REST API (Mini App) ═════════════════════════════ */

/** Wrap async handlers so rejections reach the Express error handler. */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function createApiRouter() {
  const router = express.Router();

  router.get('/health', (_req, res) => res.json({ ok: true, env: config.env }));

  // Public
  router.get('/catalog', start.getCatalog);
  router.post('/payments/crypto/webhook', wrap(cart.cryptoWebhook));

  // Authenticated via Telegram initData
  router.use(authMiddleware);
  router.post('/session', wrap(start.getSession));
  router.post('/onboarding/complete', wrap(start.completeOnboarding));
  router.post('/language', wrap(start.setLanguage));
  router.post('/cart/quote', cart.quote);
  router.post('/orders', wrap(cart.createOrder));
  router.get('/orders', wrap(start.getMyOrders));
  router.get('/orders/:id', wrap(cart.getOrderStatus));

  return router;
}

module.exports = { registerBotHandlers, createApiRouter };
