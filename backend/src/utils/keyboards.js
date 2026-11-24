'use strict';

const { Markup } = require('telegraf');
const config = require('../config/default');
const { tr } = require('./i18n');

const supportUrl = () => `https://t.me/${config.telegram.supportUsername}`;
const appUrl = (hash = '') => (config.telegram.webAppUrl ? `${config.telegram.webAppUrl}${hash}` : '');

/** Main CTA under the welcome message: opens the Mini App. */
function webAppKeyboard(lang, textKey = 'openMenu', hash = '') {
  const rows = [];
  if (config.telegram.webAppUrl) rows.push([Markup.button.webApp(tr(textKey, lang), appUrl(hash))]);
  rows.push([Markup.button.url(tr('support', lang), supportUrl()), Markup.button.callback('🌍 UZ · RU · EN', 'lang:menu')]);
  return Markup.inlineKeyboard(rows);
}

function supportKeyboard(lang) {
  return Markup.inlineKeyboard([[Markup.button.url(tr('supportLong', lang), supportUrl())]]);
}

/** After a successful payment: view orders or talk to support. */
function afterPaymentKeyboard(lang) {
  const rows = [];
  if (config.telegram.webAppUrl) rows.push([Markup.button.webApp(tr('myOrders', lang), appUrl('#/orders'))]);
  rows.push([Markup.button.url(tr('support', lang), supportUrl())]);
  return Markup.inlineKeyboard(rows);
}

function languageKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback("🇺🇿 O'zbekcha", 'lang:uz'),
      Markup.button.callback('🇷🇺 Русский', 'lang:ru'),
      Markup.button.callback('🇬🇧 English', 'lang:en'),
    ],
  ]);
}

/** One-tap phone sharing (reply keyboard). */
function requestPhoneKeyboard(lang) {
  return Markup.keyboard([[Markup.button.contactRequest(tr('sharePhone', lang))]])
    .oneTime()
    .resize();
}

module.exports = { webAppKeyboard, supportKeyboard, afterPaymentKeyboard, languageKeyboard, requestPhoneKeyboard };
