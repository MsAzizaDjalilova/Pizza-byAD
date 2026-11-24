'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../config/default');

let fileStream = null;
if (config.logFile) {
  const file = path.resolve(__dirname, '../..', config.logFile);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fileStream = fs.createWriteStream(file, { flags: 'a' });
}

const serializeError = (err) =>
  err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err;

function write(level, message, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...Object.fromEntries(
      Object.entries(meta).map(([k, v]) => [k, k === 'error' || k === 'err' ? serializeError(v) : v])
    ),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
  if (fileStream) fileStream.write(line + '\n');
}

const logger = {
  info: (msg, meta) => write('info', msg, meta),
  warn: (msg, meta) => write('warn', msg, meta),
  error: (msg, meta) => write('error', msg, meta),
  debug: (msg, meta) => {
    if (!config.isProd) write('debug', msg, meta);
  },
  /** Dedicated order event log — easy to grep: {"level":"order", ...} */
  order: (event, order, extra = {}) =>
    write('order', event, {
      orderId: order?.id,
      userId: order?.userId,
      total: order?.totalAmount,
      method: order?.paymentMethod,
      status: order?.status,
      ...extra,
    }),
};

module.exports = logger;
