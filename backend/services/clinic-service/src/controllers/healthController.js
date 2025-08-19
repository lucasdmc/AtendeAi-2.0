const db = require('../config/database');
const redis = require('../config/redis');
const logger = require('../utils/logger');

class HealthController {
  async healthCheck(req, res) {
    try {
      const dbHealth = await db.healthCheck();
      const redisHealth = await redis.healthCheck();
      
      const overallHealth = dbHealth && redisHealth;
      
      const healthData = {
        status: overallHealth ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'clinic-service',
        version: '1.0.0',
        checks: {
          database: {
            status: dbHealth ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString()
          },
          redis: {
            status: redisHealth ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString()
          }
        }
      };
      
      const statusCode = overallHealth ? 200 : 503;
      
      res.status(statusCode).json(healthData);
    } catch (error) {
      logger.error('Health check failed:', error);
      
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'clinic-service',
        version: '1.0.0',
        error: error.message
      });
    }
  }

  async readinessCheck(req, res) {
    try {
      const dbReady = await db.healthCheck();
      const redisReady = await redis.healthCheck();
      
      const isReady = dbReady && redisReady;
      
      if (isReady) {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString(),
          service: 'clinic-service'
        });
      } else {
        res.status(503).json({
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          service: 'clinic-service',
          reason: 'Dependencies not ready'
      });
      }
    } catch (error) {
      logger.error('Readiness check failed:', error);
      
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        service: 'clinic-service',
        error: error.message
      });
    }
  }

  async livenessCheck(req, res) {
    try {
      res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        service: 'clinic-service'
      });
    } catch (error) {
      logger.error('Liveness check failed:', error);
      
      res.status(500).json({
        status: 'dead',
        timestamp: new Date().toISOString(),
        service: 'clinic-service',
        error: error.message
      });
    }
  }

  async getMetrics(req, res) {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        service: 'clinic-service',
        version: '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        database: {
          connections: db.pool ? db.pool.totalCount : 0,
          idle: db.pool ? db.pool.idleCount : 0,
          waiting: db.pool ? db.pool.waitingCount : 0
        },
        redis: {
          connected: redis.isConnected
        }
      };
      
      res.status(200).json(metrics);
    } catch (error) {
      logger.error('Metrics collection failed:', error);
      
      res.status(500).json({
        error: 'Failed to collect metrics',
        message: error.message
      });
    }
  }
}

module.exports = new HealthController();
