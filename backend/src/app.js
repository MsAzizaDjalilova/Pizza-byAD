'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const config = require('./config/default');
const logger = require('./utils/logger');
const { bot, setupMenuButton } = require('./core/bot');
const { createApiRouter } = require('./routes/bot.routes');

/** Telegram only allows [A-Za-z0-9_-] in the webhook secret token. */
const secretToken = () => config.telegram.webhookSecret.replace(/[^A-Za-z0-9_-]/g, '');
const webhookPath = () => `/api/telegram/${secretToken()}`;

/** Point Telegram at this deployment (webhook) and set the menu button + commands. */
async function setupTelegram(publicUrl) {
  const url = `${publicUrl.replace(/\/$/, '')}${webhookPath()}`;
  await bot.telegram.setWebhook(url, {
    secret_token: secretToken(),
    allowed_updates: ['message', 'pre_checkout_query', 'callback_query'],
  });
  await setupMenuButton();
  return url;
}

/**
 * Build the Express app (no listen). Used by the local server (index.js)
 * and by the Vercel serverless function (/api/index.js).
 */
function createApp({ serveFrontend = true } = {}) {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(
    cors({
      origin: config.corsOrigins.includes('*') ? true : config.corsOrigins,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Init-Data'],
    })
  );

  // Telegram webhook — must come before express.json (Telegraf parses the body itself)
  app.use(bot.webhookCallback(webhookPath(), { secretToken: secretToken() }));

  // Keep the raw body for webhook signature checks (Crypto Pay)
  app.use(express.json({ limit: '100kb', verify: (req, _res, buf) => (req.rawBody = buf) }));

  /**
   * One-time setup after deploying: open
   *   https://<your-app>/api/telegram/setup?secret=<WEBHOOK_SECRET>
   * to register the webhook and the Mini App menu button.
   */
  app.get('/api/telegram/setup', async (req, res) => {
    if (!config.telegram.botToken) return res.status(400).json({ error: 'BOT_TOKEN is not set' });
    if (req.query.secret !== config.telegram.webhookSecret) return res.status(403).json({ error: 'FORBIDDEN' });
    try {
      const publicUrl = config.telegram.publicApiUrl || `https://${req.get('host')}`;
      const url = await setupTelegram(publicUrl);
      res.json({ ok: true, webhook: url.replace(secretToken(), '***') });
    } catch (err) {
      logger.error('Telegram setup failed', { error: err });
      res.status(500).json({ error: 'SETUP_FAILED', message: err.message });
    }
  });

  app.use('/api', createApiRouter());

  // Serve the built Mini App from the same server (local / VPS). Vercel serves it statically.
  const dist = path.resolve(__dirname, '../../frontend/dist');
  if (serveFrontend && fs.existsSync(dist)) {
    app.use(express.static(dist, { maxAge: '1h', index: false }));
    app.get(/^\/(?!api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    logger.error('Unhandled API error', { error: err, path: req.path });
    res.status(500).json({ error: 'INTERNAL' });
  });

  return app;
}

module.exports = { createApp, setupTelegram, webhookPath };
