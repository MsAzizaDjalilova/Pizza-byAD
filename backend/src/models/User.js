'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    telegramId: { type: DataTypes.BIGINT, allowNull: false, unique: true },
    firstName: { type: DataTypes.STRING(128), allowNull: true },
    lastName: { type: DataTypes.STRING(128), allowNull: true },
    username: { type: DataTypes.STRING(64), allowNull: true },
    languageCode: { type: DataTypes.STRING(8), allowNull: true },
    /** Chosen UI language: uz | ru | en (null = follow Telegram's language_code) */
    language: { type: DataTypes.STRING(2), allowNull: true },
    phone: { type: DataTypes.STRING(32), allowNull: true },
    hasSeenOnboarding: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    lastAddress: { type: DataTypes.STRING(255), allowNull: true },
  },
  { tableName: 'users', timestamps: true }
);

/** Create or refresh a user from a Telegram user object (bot `from` or WebApp initData user). */
User.upsertFromTelegram = async function upsertFromTelegram(tgUser) {
  const [user] = await User.findOrCreate({
    where: { telegramId: tgUser.id },
    defaults: {
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      username: tgUser.username,
      languageCode: tgUser.language_code,
    },
  });
  const changed =
    user.firstName !== (tgUser.first_name ?? null) ||
    user.username !== (tgUser.username ?? null) ||
    user.lastName !== (tgUser.last_name ?? null);
  if (changed) {
    await user.update({
      firstName: tgUser.first_name ?? null,
      lastName: tgUser.last_name ?? null,
      username: tgUser.username ?? null,
    });
  }
  return user;
};

/** Effective language for bot messages. */
User.prototype.lang = function lang() {
  const { resolveLang } = require('../utils/i18n');
  return this.language || resolveLang(this.languageCode);
};

module.exports = User;
