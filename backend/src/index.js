'use strict';

/**
 * Local / VPS entry point: Express server + Telegram bot.
 * On Vercel the same app runs as a serverless function — see /api/index.js.
 */

const config = require('./config/default');
const logger = require('./utils/logger');

/* No real database / bot token yet (e.g. first deploy on Render)? Start in demo mode instead of crashing. */
const isPlaceholder = (v) => !v || /ep-xxx|your-bot-token|example\.com/.test(v);
if (isPlaceholder(process.env.DATABASE_URL) || isPlaceholder(process.env.BOT_TOKEN)) {
  logger.warn('DATABASE_URL or BOT_TOKEN not configured — starting in DEMO mode');
  require('./demo')
    .createDemoApp()
    .listen(config.port, () => logger.info('Demo API listening', { port: config.port }));
  return;
}
const { connectDatabase, sequelize } = require('./database/connection');
const { bot } = require('./core/bot');
const { registerBotHandlers } = require('./routes/bot.routes');
const { createApp, setupTelegram } = require('./app');
const { setupMenuButton } = require('./core/bot');

async function main() {
  await connectDatabase();
  registerBotHandlers(bot);

  const app = createApp();
  const server = app.listen(config.port, () => logger.info('HTTP server listening', { port: config.port }));

  if (config.telegram.botToken) {
    if (config.telegram.publicApiUrl) {
      await setupTelegram(config.telegram.publicApiUrl);
      logger.info('Bot running in webhook mode');
    } else {
      try {
        await setupMenuButton();
      } catch (err) {
        logger.warn('Could not set menu button', { error: err });
      }
      await bot.telegram.deleteWebhook();
      bot.launch({ allowedUpdates: ['message', 'pre_checkout_query', 'callback_query'] }).catch((err) =>
        logger.error('Bot polling stopped', { error: err })
      );
      logger.info('Bot running in long-polling mode');
    }
  }

  const shutdown = async (signal) => {
    logger.info('Shutting down', { signal });
    try {
      if (!config.telegram.publicApiUrl) bot.stop(signal);
    } catch {
      /* not running */
    }
    server.close();
    await sequelize.close();
    process.exit(0);
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (err) => logger.error('Unhandled rejection', { error: err }));

main().catch((err) => {
  logger.error('Fatal startup error', { error: err });
  if (/ENOTFOUND|ECONNREFUSED|password authentication|getaddrinfo/i.test(String(err?.message || err))) {
    console.error(
      '\n❌ Could not reach the database. Put your real NeonDB URL in backend/.env (DATABASE_URL).' +
        '\n   Just want to see the app? Run:  npm run demo   (no database or bot needed)\n'
    );
  }
  process.exit(1);
});
