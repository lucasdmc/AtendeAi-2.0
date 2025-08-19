// =====================================================
// SERVIÇO DE CACHE REDIS - AUTH SERVICE
// ATENDEAI 2.0 - ENTREGÁVEL 1
// =====================================================

const redis = require('../config/redis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.defaultTTL = 3600; // 1 hora em segundos
    this.prefix = 'atendeai:auth:';
  }

  // =====================================================
  // OPERAÇÕES BÁSICAS DE CACHE
  # =====================================================

  /**
   * Definir valor no cache
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const fullKey = this.prefix + key;
      const serializedValue = JSON.stringify(value);
      
      if (ttl) {
        await redis.set(fullKey, serializedValue, ttl);
      } else {
        await redis.set(fullKey, serializedValue);
      }

      logger.debug('Cache SET', { key: fullKey, ttl, size: serializedValue.length });
      return true;
    } catch (error) {
      logger.error('Cache SET error:', error);
      return false;
    }
  }

  /**
   * Obter valor do cache
   */
  async get(key) {
    try {
      const fullKey = this.prefix + key;
      const value = await redis.get(fullKey);
      
      if (value === null) {
        logger.debug('Cache MISS', { key: fullKey });
        return null;
      }

      const parsedValue = JSON.parse(value);
      logger.debug('Cache HIT', { key: fullKey, size: value.length });
      return parsedValue;
    } catch (error) {
      logger.error('Cache GET error:', error);
      return null;
    }
  }

  /**
   * Remover valor do cache
   */
  async del(key) {
    try {
      const fullKey = this.prefix + key;
      const result = await redis.del(fullKey);
      
      logger.debug('Cache DEL', { key: fullKey, result });
      return result > 0;
    } catch (error) {
      logger.error('Cache DEL error:', error);
      return false;
    }
  }

  /**
   * Verificar se chave existe
   */
  async exists(key) {
    try {
      const fullKey = this.prefix + key;
      const result = await redis.exists(fullKey);
      
      logger.debug('Cache EXISTS', { key: fullKey, result });
      return result > 0;
    } catch (error) {
      logger.error('Cache EXISTS error:', error);
      return false;
    }
  }

  /**
   * Definir TTL para uma chave
   */
  async expire(key, ttl) {
    try {
      const fullKey = this.prefix + key;
      const result = await redis.expire(fullKey, ttl);
      
      logger.debug('Cache EXPIRE', { key: fullKey, ttl, result });
      return result;
    } catch (error) {
      logger.error('Cache EXPIRE error:', error);
      return false;
    }
  }

  /**
   * Obter TTL restante de uma chave
   */
  async ttl(key) {
    try {
      const fullKey = this.prefix + key;
      const result = await redis.ttl(fullKey);
      
      logger.debug('Cache TTL', { key: fullKey, ttl: result });
      return result;
    } catch (error) {
      logger.error('Cache TTL error:', error);
      return -1;
    }
  }

  // =====================================================
  // OPERAÇÕES DE CACHE PARA AUTENTICAÇÃO
  # =====================================================

  /**
   * Cache de refresh tokens
   */
  async setRefreshToken(userId, clinicId, token, ttl = 7 * 24 * 60 * 60) {
    const key = `refresh_token:${userId}:${clinicId}`;
    return await this.set(key, token, ttl);
  }

  async getRefreshToken(userId, clinicId) {
    const key = `refresh_token:${userId}:${clinicId}`;
    return await this.get(key);
  }

  async delRefreshToken(userId, clinicId) {
    const key = `refresh_token:${userId}:${clinicId}`;
    return await this.del(key);
  }

  /**
   * Cache de dados de usuário
   */
  async setUserData(userId, clinicId, userData, ttl = 1800) { // 30 minutos
    const key = `user_data:${userId}:${clinicId}`;
    return await this.set(key, userData, ttl);
  }

  async getUserData(userId, clinicId) {
    const key = `user_data:${userId}:${clinicId}`;
    return await this.get(key);
  }

  async delUserData(userId, clinicId) {
    const key = `user_data:${userId}:${clinicId}`;
    return await this.del(key);
  }

  /**
   * Cache de permissões do usuário
   */
  async setUserPermissions(userId, clinicId, permissions, ttl = 3600) { // 1 hora
    const key = `user_permissions:${userId}:${clinicId}`;
    return await this.set(key, permissions, ttl);
  }

  async getUserPermissions(userId, clinicId) {
    const key = `user_permissions:${userId}:${clinicId}`;
    return await this.get(key);
  }

  async delUserPermissions(userId, clinicId) {
    const key = `user_permissions:${userId}:${clinicId}`;
    return await this.del(key);
  }

  /**
   * Cache de dados da clínica
   */
  async setClinicData(clinicId, clinicData, ttl = 7200) { // 2 horas
    const key = `clinic_data:${clinicId}`;
    return await this.set(key, clinicData, ttl);
  }

  async getClinicData(clinicId) {
    const key = `clinic_data:${clinicId}`;
    return await this.get(key);
  }

  async delClinicData(clinicId) {
    const key = `clinic_data:${clinicId}`;
    return await this.del(key);
  }

  // =====================================================
  // OPERAÇÕES DE CACHE PARA RATE LIMITING
  # =====================================================

  /**
   * Rate limiting por IP
   */
  async incrementRateLimit(ip, windowMs = 15 * 60 * 1000) {
    try {
      const key = `rate_limit:ip:${ip}`;
      const windowSeconds = Math.ceil(windowMs / 1000);
      
      const current = await redis.get(key);
      if (current === null) {
        await redis.set(key, '1', windowSeconds);
        return 1;
      }
      
      const count = parseInt(current) + 1;
      await redis.set(key, count.toString(), windowSeconds);
      
      return count;
    } catch (error) {
      logger.error('Rate limit increment error:', error);
      return 0;
    }
  }

  async getRateLimit(ip) {
    try {
      const key = `rate_limit:ip:${ip}`;
      const current = await redis.get(key);
      return current ? parseInt(current) : 0;
    } catch (error) {
      logger.error('Rate limit get error:', error);
      return 0;
    }
  }

  /**
   * Rate limiting por usuário
   */
  async incrementUserRateLimit(userId, clinicId, windowMs = 15 * 60 * 1000) {
    try {
      const key = `rate_limit:user:${userId}:${clinicId}`;
      const windowSeconds = Math.ceil(windowMs / 1000);
      
      const current = await redis.get(key);
      if (current === null) {
        await redis.set(key, '1', windowSeconds);
        return 1;
      }
      
      const count = parseInt(current) + 1;
      await redis.set(key, count.toString(), windowSeconds);
      
      return count;
    } catch (error) {
      logger.error('User rate limit increment error:', error);
      return 0;
    }
  }

  async getUserRateLimit(userId, clinicId) {
    try {
      const key = `rate_limit:user:${userId}:${clinicId}`;
      const current = await redis.get(key);
      return current ? parseInt(current) : 0;
    } catch (error) {
      logger.error('User rate limit get error:', error);
      return 0;
    }
  }

  // =====================================================
  // OPERAÇÕES DE CACHE PARA SESSÕES
  # =====================================================

  /**
   * Cache de sessões ativas
   */
  async setActiveSession(sessionId, sessionData, ttl = 1800) { // 30 minutos
    const key = `active_session:${sessionId}`;
    return await this.set(key, sessionData, ttl);
  }

  async getActiveSession(sessionId) {
    const key = `active_session:${sessionId}`;
    return await this.get(key);
  }

  async delActiveSession(sessionId) {
    const key = `active_session:${sessionId}`;
    return await this.del(key);
  }

  /**
   * Cache de blacklist de tokens
   */
  async addToBlacklist(token, ttl = 3600) { // 1 hora
    const key = `blacklist:${token}`;
    return await this.set(key, { blacklisted: true, timestamp: Date.now() }, ttl);
  }

  async isBlacklisted(token) {
    const key = `blacklist:${token}`;
    return await this.exists(key);
  }

  // =====================================================
  // OPERAÇÕES DE CACHE EM LOTE
  # =====================================================

  /**
   * Obter múltiplas chaves
   */
  async mget(keys) {
    try {
      const fullKeys = keys.map(key => this.prefix + key);
      const values = await redis.mget(fullKeys);
      
      const result = {};
      keys.forEach((key, index) => {
        if (values[index] !== null) {
          try {
            result[key] = JSON.parse(values[index]);
          } catch {
            result[key] = values[index];
          }
        }
      });
      
      logger.debug('Cache MGET', { keys: fullKeys, found: Object.keys(result).length });
      return result;
    } catch (error) {
      logger.error('Cache MGET error:', error);
      return {};
    }
  }

  /**
   * Definir múltiplas chaves
   */
  async mset(keyValuePairs, ttl = this.defaultTTL) {
    try {
      const pipeline = redis.client.multi();
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const fullKey = this.prefix + key;
        const serializedValue = JSON.stringify(value);
        
        if (ttl) {
          pipeline.setEx(fullKey, ttl, serializedValue);
        } else {
          pipeline.set(fullKey, serializedValue);
        }
      }
      
      const results = await pipeline.exec();
      const successCount = results.filter(result => result[1] === 'OK').length;
      
      logger.debug('Cache MSET', { 
        keys: Object.keys(keyValuePairs).length, 
        success: successCount,
        ttl 
      });
      
      return successCount === Object.keys(keyValuePairs).length;
    } catch (error) {
      logger.error('Cache MSET error:', error);
      return false;
    }
  }

  // =====================================================
  // OPERAÇÕES DE MANUTENÇÃO
  # =====================================================

  /**
   * Limpar cache por padrão
   */
  async clearByPattern(pattern) {
    try {
      const fullPattern = this.prefix + pattern;
      const keys = await redis.keys(fullPattern);
      
      if (keys.length === 0) {
        logger.debug('Cache clear pattern: No keys found', { pattern: fullPattern });
        return 0;
      }
      
      const pipeline = redis.client.multi();
      keys.forEach(key => pipeline.del(key));
      const results = await pipeline.exec();
      
      const deletedCount = results.filter(result => result[1] > 0).length;
      
      logger.info('Cache clear pattern', { 
        pattern: fullPattern, 
        keysFound: keys.length, 
        deleted: deletedCount 
      });
      
      return deletedCount;
    } catch (error) {
      logger.error('Cache clear pattern error:', error);
      return 0;
    }
  }

  /**
   * Limpar cache de usuário específico
   */
  async clearUserCache(userId, clinicId) {
    try {
      const patterns = [
        `user_data:${userId}:${clinicId}`,
        `user_permissions:${userId}:${clinicId}`,
        `active_session:*`,
        `rate_limit:user:${userId}:${clinicId}`,
      ];
      
      let totalDeleted = 0;
      for (const pattern of patterns) {
        totalDeleted += await this.clearByPattern(pattern);
      }
      
      logger.info('User cache cleared', { userId, clinicId, deleted: totalDeleted });
      return totalDeleted;
    } catch (error) {
      logger.error('Clear user cache error:', error);
      return 0;
    }
  }

  /**
   * Limpar cache de clínica específica
   */
  async clearClinicCache(clinicId) {
    try {
      const patterns = [
        `clinic_data:${clinicId}`,
        `user_data:*:${clinicId}`,
        `user_permissions:*:${clinicId}`,
        `rate_limit:user:*:${clinicId}`,
      ];
      
      let totalDeleted = 0;
      for (const pattern of patterns) {
        totalDeleted += await this.clearByPattern(pattern);
      }
      
      logger.info('Clinic cache cleared', { clinicId, deleted: totalDeleted });
      return totalDeleted;
    } catch (error) {
      logger.error('Clear clinic cache error:', error);
      return 0;
    }
  }

  /**
   * Estatísticas do cache
   */
  async getStats() {
    try {
      const info = await redis.info('memory');
      const keys = await redis.keys(this.prefix + '*');
      
      const stats = {
        totalKeys: keys.length,
        prefix: this.prefix,
        memoryInfo: info,
        patterns: {
          refreshTokens: keys.filter(k => k.includes('refresh_token')).length,
          userData: keys.filter(k => k.includes('user_data')).length,
          userPermissions: keys.filter(k => k.includes('user_permissions')).length,
          clinicData: keys.filter(k => k.includes('clinic_data')).length,
          rateLimits: keys.filter(k => k.includes('rate_limit')).length,
          activeSessions: keys.filter(k => k.includes('active_session')).length,
          blacklist: keys.filter(k => k.includes('blacklist')).length,
        }
      };
      
      logger.debug('Cache stats', stats);
      return stats;
    } catch (error) {
      logger.error('Cache stats error:', error);
      return null;
    }
  }

  // =====================================================
  // HEALTH CHECK
  # =====================================================
  async healthCheck() {
    try {
      const start = Date.now();
      await redis.ping();
      const latency = Date.now() - start;
      
      const stats = await this.getStats();
      
      return {
        status: 'healthy',
        latency: `${latency}ms`,
        stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Exportar instância singleton
module.exports = new CacheService();
