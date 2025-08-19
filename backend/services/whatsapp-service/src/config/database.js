const { Pool } = require('pg');
const config = require('./index');
const logger = require('../utils/logger');

const pool = new Pool(config.database);

pool.on('connect', (client) => {
  logger.info('New client connected to whatsapp service database');
});

pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('remove', (client) => {
  logger.info('Client removed from whatsapp service database pool');
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.info('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Query error', { text, duration, error: error.message });
    throw error;
  }
};

const getClient = () => {
  return pool.connect();
};

const close = () => {
  return pool.end();
};

module.exports = {
  query,
  getClient,
  close,
  pool
};
