'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const User = require('./User');

const PAYMENT_METHODS = ['stars', 'click', 'payme', 'crypto'];
const STATUSES = ['pending', 'paid', 'cooking', 'delivering', 'delivered', 'cancelled', 'failed'];

const Order = sequelize.define(
  'Order',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    /** [{ productId, name, size, unitPrice, qty, lineTotal }] — server-priced snapshot */
    items: { type: DataTypes.JSONB, allowNull: false },
    orderBumpAdded: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    subtotal: { type: DataTypes.INTEGER, allowNull: false },
    deliveryFee: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    /** Total in UZS (so'm) */
    totalAmount: { type: DataTypes.INTEGER, allowNull: false },
    /** Amount actually charged in the payment currency (Stars / tiyin / crypto) */
    chargedAmount: { type: DataTypes.DECIMAL(18, 6), allowNull: true },
    chargedCurrency: { type: DataTypes.STRING(8), allowNull: true },
    paymentMethod: { type: DataTypes.ENUM(...PAYMENT_METHODS), allowNull: false },
    status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'pending' },
    phone: { type: DataTypes.STRING(32), allowNull: true },
    address: { type: DataTypes.STRING(255), allowNull: true },
    comment: { type: DataTypes.STRING(500), allowNull: true },
    /** Telegram charge ids or Crypto Pay invoice id */
    externalPaymentId: { type: DataTypes.STRING(128), allowNull: true },
    paidAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: 'orders',
    timestamps: true,
    indexes: [{ fields: ['userId'] }, { fields: ['status'] }],
  }
);

User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Order.PAYMENT_METHODS = PAYMENT_METHODS;
Order.STATUSES = STATUSES;

module.exports = Order;
