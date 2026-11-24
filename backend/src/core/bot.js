'use strict';

const { Telegraf } = require('telegraf');
const config = require('../config/default');
const logger = require('../utils/logger');
const { tr } = require('../utils/i18n');

if (!config.telegram.botToken) {
  logger.warn('BOT_TOKEN is not set — the bot and payments will not work');
}

const bot = new Telegraf(config.telegram.botToken || '0:missing-token', {
  handlerTimeout: 30_000,
});

bot.catch((err, ctx) => {
  logger.error('Bot update failed', { error: err, updateType: ctx?.updateType });
});

/* ───────────────────────── WebApp launcher ───────────────────────── */

const COMMANDS = {
  uz: [
    { command: 'start', description: '🍕 Menyuni ochish' },
    { command: 'orders', description: '📦 Buyurtmalarim' },
    { command: 'lang', description: '🌍 Tilni tanlash' },
    { command: 'help', description: '💌 Yordam' },
  ],
  ru: [
    { command: 'start', description: '🍕 Открыть меню' },
    { command: 'orders', description: '📦 Мои заказы' },
    { command: 'lang', description: '🌍 Сменить язык' },
    { command: 'help', description: '💌 Поддержка' },
  ],
  en: [
    { command: 'start', description: '🍕 Open the menu' },
    { command: 'orders', description: '📦 My orders' },
    { command: 'lang', description: '🌍 Change language' },
    { command: 'help', description: '💌 Support' },
  ],
};

/** Sets the persistent "Menu" button and localized command lists. */
async function setupMenuButton() {
  if (config.telegram.webAppUrl) {
    await bot.telegram.setChatMenuButton({
      menuButton: { type: 'web_app', text: '🍕 Menu', web_app: { url: config.telegram.webAppUrl } },
    });
  }
  await bot.telegram.setMyCommands(COMMANDS.uz);
  await bot.telegram.setMyCommands(COMMANDS.ru, { language_code: 'ru' });
  await bot.telegram.setMyCommands(COMMANDS.en, { language_code: 'en' });
}

/* ───────────────────────── Telegram Payments ───────────────────────── */

const PROVIDERS = {
  stars: () => ({ currency: 'XTR', providerToken: '' }),
  click: () => ({ currency: 'UZS', providerToken: config.payments.clickToken }),
  payme: () => ({ currency: 'UZS', providerToken: config.payments.paymeToken }),
};

/** UZS → whole Telegram Stars (always at least 1). */
const uzsToStars = (uzs) => Math.max(1, Math.ceil(uzs / config.payments.uzsPerStar));

/**
 * Create an invoice link the Mini App opens with `Telegram.WebApp.openInvoice()`.
 * The order id travels in the payload and is verified in pre_checkout_query.
 */
async function createInvoiceLink(order, method, lang = 'uz') {
  const provider = PROVIDERS[method]?.();
  if (!provider) throw new Error(`Unsupported Telegram payment method: ${method}`);
  if (method !== 'stars' && !provider.providerToken) throw new Error(`${method} is not configured`);

  let prices;
  let chargedAmount;
  if (provider.currency === 'XTR') {
    chargedAmount = uzsToStars(order.totalAmount);
    prices = [{ label: tr('orderTitle', lang, { id: order.id }), amount: chargedAmount }];
  } else {
    // UZS uses 2 decimal places in the Bot API → multiply by 100
    prices = order.items.map((i) => ({
      label: `${i.name}${i.size ? ` (${i.size})` : ''} × ${i.qty}`.slice(0, 60),
      amount: i.lineTotal * 100,
    }));
    if (order.deliveryFee > 0) prices.push({ label: tr('delivery', lang), amount: order.deliveryFee * 100 });
    chargedAmount = order.totalAmount * 100;
  }

  const link = await bot.telegram.createInvoiceLink({
    title: `${config.brand.name} · #${order.id}`,
    description: order.items.map((i) => `${i.name} × ${i.qty}`).join(', ').slice(0, 255),
    payload: JSON.stringify({ orderId: order.id }),
    provider_token: provider.providerToken,
    currency: provider.currency,
    prices,
    need_phone_number: method !== 'stars' && !order.phone,
  });

  return { link, chargedAmount, currency: provider.currency };
}

/** Fire-and-forget message to the admin/kitchen chat. */
async function notifyAdmin(text) {
  if (!config.telegram.adminChatId) return;
  try {
    await bot.telegram.sendMessage(config.telegram.adminChatId, text, { parse_mode: 'HTML' });
  } catch (err) {
    logger.warn('Admin notification failed', { error: err });
  }
}

module.exports = { bot, setupMenuButton, createInvoiceLink, uzsToStars, notifyAdmin };
