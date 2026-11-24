'use strict';

const crypto = require('crypto');
const config = require('../config/default');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Validate Telegram WebApp initData.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *   secret_key = HMAC_SHA256(key="WebAppData", msg=bot_token)
 *   hash       = hex(HMAC_SHA256(key=secret_key, msg=data_check_string))
 * Returns the parsed user object or null.
 */
function verifyInitData(initData, botToken, maxAgeSeconds) {
  if (!initData || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash || !/^[a-f0-9]{64}$/i.test(hash)) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computed = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest();
  const given = Buffer.from(hash, 'hex');
  if (given.length !== computed.length || !crypto.timingSafeEqual(given, computed)) return null;

  const authDate = Number(params.get('auth_date'));
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSeconds) return null;

  try {
    const user = JSON.parse(params.get('user') || 'null');
    return user && user.id ? user : null;
  } catch {
    return null;
  }
}

const DEV_USER = { id: 100000001, first_name: 'Dev', username: 'dev_girl', language_code: 'uz' };

async function authMiddleware(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const initData = header.startsWith('tma ') ? header.slice(4) : req.get('x-telegram-init-data');

    let tgUser = verifyInitData(initData, config.telegram.botToken, config.telegram.initDataMaxAge);
    if (!tgUser && config.devSkipAuth) tgUser = DEV_USER;
    if (!tgUser) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: "Open the app inside Telegram" });
    }

    req.tgUser = tgUser;
    req.user = await User.upsertFromTelegram(tgUser);
    return next();
  } catch (err) {
    logger.error('Auth middleware failed', { error: err });
    return res.status(500).json({ error: 'AUTH_FAILED' });
  }
}

module.exports = { authMiddleware, verifyInitData };
