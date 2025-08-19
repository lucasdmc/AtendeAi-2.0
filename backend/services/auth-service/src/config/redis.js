// =====================================================
// CONFIGURAÇÃO DO REDIS - AUTH SERVICE
// ATENDEAI 2.0 - ENTREGÁVEL 1
// =====================================================

const { createClient } = require('redis');
const config = require('./index');
const logger = require('../utils/logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  // =====================================================
  // CONEXÃO COM O REDIS
  // =====================================================
  async connect() {
    try {
      if (this.isConnected) {
        logger.info('Redis already connected');
        return;
      }

      this.client = createClient({
        url: config.redis.url,
        password: config.redis.password,
        database: config.redis.db,
        retryDelayOnFailover: config.redis.retryDelayOnFailover,
        maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
        socket: {
          connectTimeout: 10000,
          keepAlive: 5000,
        },
      });

      // Event listeners
      this.client.on('connect', () => {
        logger.info('🔄 Redis connecting...');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        logger.info('✅ Redis connected successfully');
      });

      this.client.on('error', (error) => {
        logger.error('❌ Redis error:', error);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        logger.info('Redis connection ended');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('🔄 Redis reconnecting...');
      });

      // Conectar
      await this.client.connect();

    } catch (error) {
      logger.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  // =====================================================
  // DESCONEXÃO DO REDIS
  // =====================================================
  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        this.client = null;
        this.isConnected = false;
        logger.info('✅ Redis disconnected successfully');
      }
    } catch (error) {
      logger.error('❌ Error disconnecting from Redis:', error);
      throw error;
    }
  }

  // =====================================================
  // OPERAÇÕES BÁSICAS
  // =====================================================

  // SET
  async set(key, value, ttl = null) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      if (ttl) {
        await this.client.setEx(key, ttl, JSON.stringify(value));
      } else {
        await this.client.set(key, JSON.stringify(value));
      }

      logger.debug('Redis SET:', { key, ttl });
      return true;
    } catch (error) {
      logger.error('❌ Redis SET error:', error);
      throw error;
    }
  }

  // GET
  async get(key) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const value = await this.client.get(key);
      
      if (value === null) {
        return null;
      }

      logger.debug('Redis GET:', { key });
      return JSON.parse(value);
    } catch (error) {
      logger.error('❌ Redis GET error:', error);
      throw error;
    }
  }

  // DELETE
  async del(key) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.del(key);
      logger.debug('Redis DEL:', { key, result });
      return result > 0;
    } catch (error) {
      logger.error('❌ Redis DEL error:', error);
      throw error;
    }
  }

  // EXISTS
  async exists(key) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.exists(key);
      logger.debug('Redis EXISTS:', { key, result });
      return result > 0;
    } catch (error) {
      logger.error('❌ Redis EXISTS error:', error);
      throw error;
    }
  }

  // EXPIRE
  async expire(key, seconds) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.expire(key, seconds);
      logger.debug('Redis EXPIRE:', { key, seconds, result });
      return result;
    } catch (error) {
      logger.error('❌ Redis EXPIRE error:', error);
      throw error;
    }
  }

  // TTL
  async ttl(key) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.ttl(key);
      logger.debug('Redis TTL:', { key, result });
      return result;
    } catch (error) {
      logger.error('❌ Redis TTL error:', error);
      throw error;
    }
  }

  // =====================================================
  // OPERAÇÕES DE LISTA
  // =====================================================

  // LPUSH
  async lpush(key, value) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.lPush(key, JSON.stringify(value));
      logger.debug('Redis LPUSH:', { key, result });
      return result;
    } catch (error) {
      logger.error('❌ Redis LPUSH error:', error);
      throw error;
    }
  }

  // RPUSH
  async rpush(key, value) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.rPush(key, JSON.stringify(value));
      logger.debug('Redis RPUSH:', { key, result });
      return result;
    } catch (error) {
      logger.error('❌ Redis RPUSH error:', error);
      throw error;
    }
  }

  // LRANGE
  async lrange(key, start, stop) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.lRange(key, start, stop);
      const parsed = result.map(item => JSON.parse(item));
      
      logger.debug('Redis LRANGE:', { key, start, stop, count: parsed.length });
      return parsed;
    } catch (error) {
      logger.error('❌ Redis LRANGE error:', error);
      throw error;
    }
  }

  // =====================================================
  // OPERAÇÕES DE HASH
  // =====================================================

  // HSET
  async hset(key, field, value) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.hSet(key, field, JSON.stringify(value));
      logger.debug('Redis HSET:', { key, field, result });
      return result;
    } catch (error) {
      logger.error('❌ Redis HSET error:', error);
      throw error;
    }
  }

  // HGET
  async hget(key, field) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const value = await this.client.hGet(key, field);
      
      if (value === null) {
        return null;
      }

      logger.debug('Redis HGET:', { key, field });
      return JSON.parse(value);
    } catch (error) {
      logger.error('❌ Redis HGET error:', error);
      throw error;
    }
  }

  // HGETALL
  async hgetall(key) {
    try {
      if (!this.isConnected) {
        throw new Error('Redis not connected');
      }

      const result = await this.client.hGetAll(key);
      const parsed = {};
      
      for (const [field, value] of Object.entries(result)) {
        try {
          parsed[field] = JSON.parse(value);
        } catch {
          parsed[field] = value;
        }
      }

      logger.debug('Redis HGETALL:', { key, fields: Object.keys(parsed) });
      return parsed;
    } catch (error) {
      logger.error('❌ Redis HGETALL error:', error);
      throw error;
    }
  }

  // =====================================================
  // VERIFICAR CONEXÃO
  // =====================================================
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: 'Redis not connected' };
      }

      const start = Date.now();
      await this.client.ping();
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency: `${latency}ms`,
        memory: await this.client.info('memory'),
        clients: await this.client.info('clients'),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  // =====================================================
  // GETTERS
  // =====================================================
  get isConnected() {
    return this._isConnected;
  }

  set isConnected(value) {
    this._isConnected = value;
  }

  get client() {
    return this._client;
  }

  set client(value) {
    this._client = value;
  }
}

// Exportar instância singleton
module.exports = new RedisClient();
