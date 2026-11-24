'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const env = (key, fallback = '') => {
  const v = process.env[key];
  return v === undefined || v === '' ? fallback : v;
};
const bool = (key, fallback = false) => {
  const v = process.env[key];
  if (v === undefined || v === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
};
const num = (key, fallback) => {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const nodeEnv = env('NODE_ENV', 'development');

const config = {
  env: nodeEnv,
  isProd: nodeEnv === 'production',
  port: num('PORT', 3100),
  corsOrigins: env('CORS_ORIGINS', '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  devSkipAuth: nodeEnv === 'development' && bool('DEV_SKIP_AUTH'),
  logFile: env('LOG_FILE', ''),

  brand: {
    name: 'Blush Slice Pizza',
    currency: 'UZS',
  },

  telegram: {
    botToken: env('BOT_TOKEN'),
    webAppUrl: env('WEBAPP_URL'),
    // On Render, RENDER_EXTERNAL_URL is set automatically → bot switches to webhook mode
    publicApiUrl: env('PUBLIC_API_URL', env('RENDER_EXTERNAL_URL')).replace(/\/$/, ''),
    webhookSecret: env('WEBHOOK_SECRET', 'blush-slice-hook'),
    adminChatId: env('ADMIN_CHAT_ID'),
    supportUsername: env('SUPPORT_USERNAME', 'blushslice_support'),
    // initData older than this is rejected (seconds)
    initDataMaxAge: num('INIT_DATA_MAX_AGE', 24 * 60 * 60),
  },

  payments: {
    clickToken: env('CLICK_PROVIDER_TOKEN'),
    paymeToken: env('PAYME_PROVIDER_TOKEN'),
    uzsPerStar: num('UZS_PER_STAR', 220),
    cryptoPayToken: env('CRYPTOPAY_TOKEN'),
    cryptoPayTestnet: bool('CRYPTOPAY_TESTNET', true),
    cryptoAsset: env('CRYPTO_ASSET', 'USDT'),
    uzsPerUsd: num('UZS_PER_USD', 12800),
  },

  pricing: {
    deliveryFee: 15000,
    freeDeliveryFrom: 150000,
    maxItemQty: 20,
  },

  db: {
    url: env('DATABASE_URL'),
    ssl: bool('DB_SSL', true),
  },
};

module.exports = config;
