'use strict';

const { Sequelize } = require('sequelize');
const config = require('../config/default');
const logger = require('../utils/logger');

if (!config.db.url) {
  logger.warn('DATABASE_URL is not set — database calls will fail until it is configured');
}

/**
 * Clean up a pasted Neon URL: trim spaces, add a missing scheme, and drop
 * query params node-postgres doesn't understand (channel_binding) — SSL is set below.
 */
function cleanDbUrl(raw) {
  let url = String(raw || '').trim().replace(/^["']|["']$/g, '');
  if (!url) return 'postgres://localhost:5432/blushslice';
  if (!/^postgres(ql)?:\/\//i.test(url)) url = `postgresql://${url.replace(/^\/+/, '')}`;
  try {
    const u = new URL(url);
    u.searchParams.delete('channel_binding');
    u.searchParams.delete('sslmode');
    return u.toString();
  } catch {
    return url;
  }
}

const sequelize = new Sequelize(cleanDbUrl(config.db.url), {
  dialect: 'postgres',
  // Explicit driver so serverless bundlers (Vercel) include it
  dialectModule: require('pg'),
  logging: false,
  dialectOptions: config.db.ssl
    ? { ssl: { require: true, rejectUnauthorized: false } } // NeonDB requires TLS
    : {},
  pool: { max: process.env.VERCEL ? 2 : 5, min: 0, idle: 10000, acquire: 30000 },
});

async function connectDatabase() {
  await sequelize.authenticate();
  // Load models + associations before syncing
  require('../models/User');
  require('../models/Order');
  // `alter` keeps tables in step with model changes. For larger teams switch to migrations.
  await sequelize.sync({ alter: !config.isProd });
  logger.info('Database connected', { dialect: 'postgres' });
}

module.exports = { sequelize, connectDatabase };
