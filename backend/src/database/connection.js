'use strict';

const { Sequelize } = require('sequelize');
const config = require('../config/default');
const logger = require('../utils/logger');

if (!config.db.url) {
  logger.warn('DATABASE_URL is not set — database calls will fail until it is configured');
}

const sequelize = new Sequelize(config.db.url || 'postgres://localhost:5432/blushslice', {
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
