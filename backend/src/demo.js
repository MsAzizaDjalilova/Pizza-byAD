'use strict';

/**
 * DEMO MODE — run the whole Mini App with no database, bot token or payment provider.
 *
 *   npm run demo        → API on http://localhost:3100 (or $PORT)
 *
 * Uses the real menu, pricing and validation (startController.calculateOrder),
 * but keeps users and orders in memory and "pays" instantly.
 * Never use this in production.
 */

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const config = require('./config/default');
const { publicCatalog, calculateOrder, ValidationError } = require('./controllers/startController');

const PORT = config.port;
const PHONE_RE = /^\+?998\d{9}$/;
const LANGS = ['uz', 'ru', 'en'];

/* ───────── in-memory store ───────── */
const users = new Map(); // telegramId → user
const orders = []; // newest last
let nextOrderId = 1001;

/** Use the Telegram user from initData if present (unverified — demo only), else a demo girl. */
function demoUser(req) {
  let tg = { id: 1, first_name: 'Malika', language_code: 'uz' };
  const header = req.get('authorization') || '';
  if (header.startsWith('tma ') && header.length > 4) {
    try {
      const u = JSON.parse(new URLSearchParams(header.slice(4)).get('user') || 'null');
      if (u?.id) tg = u;
    } catch {
      /* ignore */
    }
  }
  if (!users.has(tg.id)) {
    users.set(tg.id, {
      id: tg.id,
      firstName: tg.first_name,
      username: tg.username || null,
      phone: null,
      lastAddress: null,
      hasSeenOnboarding: false,
      language: null,
    });
  }
  return users.get(tg.id);
}

function createDemoApp({ serveFrontend = true } = {}) {
const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));
app.use('/api', (req, _res, next) => {
  req.user = demoUser(req);
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true, mode: 'demo' }));
app.get('/api/catalog', (_req, res) => res.json(publicCatalog()));

app.post('/api/session', (req, res) => {
  const today = new Date().toDateString();
  res.json({
    user: req.user,
    socialProof: { ordersToday: orders.filter((o) => new Date(o.createdAt).toDateString() === today).length },
    paymentMethods: [
      { id: 'stars', title: 'Telegram Stars', emoji: '⭐️' },
      { id: 'click', title: 'Click', emoji: '💳' },
      { id: 'payme', title: 'Payme', emoji: '💠' },
      { id: 'crypto', title: 'Crypto (USDT/TON)', emoji: '🪙' },
    ],
    support: config.telegram.supportUsername,
    demo: true,
  });
});

app.post('/api/onboarding/complete', (req, res) => {
  req.user.hasSeenOnboarding = true;
  res.json({ ok: true });
});

app.post('/api/language', (req, res) => {
  const lang = String(req.body?.language || '');
  if (!LANGS.includes(lang)) return res.status(400).json({ error: 'INVALID_LANGUAGE' });
  req.user.language = lang;
  res.json({ ok: true, language: lang });
});

app.post('/api/cart/quote', (req, res) => {
  try {
    res.json(calculateOrder(req.body?.items, Boolean(req.body?.orderBump)));
  } catch (err) {
    if (err instanceof ValidationError) return res.status(400).json({ error: err.code });
    throw err;
  }
});

app.post('/api/orders', (req, res) => {
  const { items, orderBump, paymentMethod, address, comment } = req.body || {};
  const phone = String(req.body?.phone || '').replace(/[\s\-()]/g, '');
  if (!['stars', 'click', 'payme', 'crypto'].includes(paymentMethod)) return res.status(400).json({ error: 'INVALID_PAYMENT_METHOD' });
  if (!PHONE_RE.test(phone)) return res.status(400).json({ error: 'INVALID_PHONE' });
  if (String(address || '').trim().length < 5) return res.status(400).json({ error: 'INVALID_ADDRESS' });

  let calc;
  try {
    calc = calculateOrder(items, Boolean(orderBump));
  } catch (err) {
    if (err instanceof ValidationError) return res.status(400).json({ error: err.code });
    throw err;
  }

  const order = {
    id: nextOrderId++,
    userId: req.user.id,
    ...calc,
    paymentMethod,
    phone,
    address: String(address).trim(),
    comment: comment || null,
    status: 'paid', // demo: instantly "paid"
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  Object.assign(req.user, { phone, lastAddress: order.address });
  console.log(`[demo] order #${order.id} · ${paymentMethod} · ${order.totalAmount} UZS`);

  res.status(201).json({
    orderId: order.id,
    method: paymentMethod,
    invoiceLink: null,
    demo: true,
    totalAmount: order.totalAmount,
  });
});

app.get('/api/orders', (req, res) => {
  res.json({ orders: orders.filter((o) => o.userId === req.user.id).slice().reverse() });
});

app.get('/api/orders/:id', (req, res) => {
  const o = orders.find((x) => x.id === Number(req.params.id) && x.userId === req.user.id);
  if (!o) return res.status(404).json({ error: 'NOT_FOUND' });
  res.json(o);
});

// Serve the built Mini App too, if present (npm run build in /frontend)
const dist = path.resolve(__dirname, '../../frontend/dist');
if (serveFrontend && fs.existsSync(dist)) {
  app.use(express.static(dist, { index: false }));
  app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[demo] error', err);
  res.status(500).json({ error: 'INTERNAL' });
});

  return app;
}

module.exports = { createDemoApp };

if (require.main === module) {
  createDemoApp().listen(PORT, () => {
    console.log(`\n🍕 Blush Slice DEMO API → http://localhost:${PORT}`);
    console.log('   No database, no bot, payments are simulated.\n');
  });
}
