const redis = require('redis');
const config = require('./index');
const logger = require('../utils/logger');

const client = redis.createClient({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  keyPrefix: config.redis.keyPrefix,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      logger.error('Redis server refused connection');
      return new Error('Redis server refused connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      logger.error('Redis retry time exhausted');
      return new Error('Redis retry time exhausted');
    }
    if (options.attempt > 10) {
      logger.error('Redis max retry attempts reached');
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

client.on('connect', () => {
  logger.info('Redis client connected for appointment service');
});

client.on('ready', () => {
  logger.info('Redis client ready for appointment service');
});

client.on('error', (err) => {
  logger.error('Redis client error', err);
});

client.on('end', () => {
  logger.info('Redis client connection ended');
});

client.on('reconnecting', () => {
  logger.info('Redis client reconnecting');
});

const get = async (key) => {
  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Redis get error', { key, error: error.message });
    return null;
  }
};

const set = async (key, value, ttl = 3600) => {
  try {
    const serializedValue = JSON.stringify(value);
    if (ttl > 0) {
      await client.setex(key, ttl, serializedValue);
    } else {
      await client.set(key, serializedValue);
    }
    return true;
  } catch (error) {
    logger.error('Redis set error', { key, error: error.message });
    return false;
  }
};

const del = async (key) => {
  try {
    await client.del(key);
    return true;
  } catch (error) {
    logger.error('Redis del error', { key, error: error.message });
    return false;
  }
};

const exists = async (key) => {
  try {
    return await client.exists(key);
  } catch (error) {
    logger.error('Redis exists error', { key, error: error.message });
    return false;
  }
};

const expire = async (key, ttl) => {
  try {
    return await client.expire(key, ttl);
  } catch (error) {
    logger.error('Redis expire error', { key, ttl, error: error.message });
    return false;
  }
};

const close = () => {
  return client.quit();
};

module.exports = {
  client,
  get,
  set,
  del,
  exists,
  expire,
  close
};
