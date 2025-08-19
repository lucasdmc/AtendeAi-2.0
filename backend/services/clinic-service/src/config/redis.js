const redis = require('redis');
const config = require('./index');
const logger = require('../utils/logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        socket: {
          host: config.redis.host,
          port: config.redis.port
        },
        password: config.redis.password,
        database: config.redis.db
      });

      this.client.on('error', (err) => {
        logger.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        logger.info('Redis Client Ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        logger.info('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      
    } catch (error) {
      logger.error('Redis connection failed:', error);
      throw error;
    }
  }

  async get(key) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const value = await this.client.get(`${config.redis.keyPrefix}${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key, value, ttl = config.redis.ttl) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(`${config.redis.keyPrefix}${key}`, ttl, serializedValue);
      } else {
        await this.client.set(`${config.redis.keyPrefix}${key}`, serializedValue);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      await this.client.del(`${config.redis.keyPrefix}${key}`);
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      const result = await this.client.exists(`${config.redis.keyPrefix}${key}`);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async flush() {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      await this.client.flushDb();
      logger.info('Redis database flushed');
      return true;
    } catch (error) {
      logger.error('Redis FLUSH error:', error);
      return false;
    }
  }

  async healthCheck() {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  async close() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }
}

module.exports = new RedisClient();
