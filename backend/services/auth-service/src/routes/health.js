// =====================================================
// ROTAS DE HEALTH CHECK - AUTH SERVICE
// ATENDEAI 2.0 - ENTREGÁVEL 1
// =====================================================

const express = require('express');
const database = require('../config/database');
const redis = require('../config/redis');
const logger = require('../utils/logger');

const router = express.Router();

// =====================================================
// HEALTH CHECK BÁSICO
// =====================================================
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Verificar status dos serviços
    const dbHealth = await database.healthCheck();
    const redisHealth = await redis.healthCheck();
    
    const responseTime = Date.now() - startTime;
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'AtendeAI Auth Service',
      version: '1.0.0',
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      services: {
        database: dbHealth.status,
        redis: redisHealth.status,
        auth: 'healthy',
      },
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
      },
      ...(dbHealth.status === 'healthy' && {
        database: {
          version: dbHealth.version,
          connections: dbHealth.connections,
          idle: dbHealth.idle,
          waiting: dbHealth.waiting,
        }
      }),
      ...(redisHealth.status === 'healthy' && {
        redis: {
          latency: redisHealth.latency,
        }
      }),
    };

    // Determinar status geral
    if (dbHealth.status === 'unhealthy' || redisHealth.status === 'unhealthy') {
      healthStatus.status = 'unhealthy';
      res.status(503);
    }

    logger.info('Health check completed', {
      status: healthStatus.status,
      responseTime,
      dbStatus: dbHealth.status,
      redisStatus: redisHealth.status,
    });

    res.json(healthStatus);

  } catch (error) {
    logger.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'AtendeAI Auth Service',
      error: error.message,
      services: {
        database: 'unknown',
        redis: 'unknown',
        auth: 'unhealthy',
      },
    });
  }
});

// =====================================================
// HEALTH CHECK DETALHADO
// =====================================================
router.get('/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Verificações detalhadas
    const checks = {
      database: await database.healthCheck(),
      redis: await redis.healthCheck(),
      memory: {
        status: 'healthy',
        details: {
          heapUsed: process.memoryUsage().heapUsed,
          heapTotal: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external,
          rss: process.memoryUsage().rss,
        }
      },
      process: {
        status: 'healthy',
        details: {
          pid: process.pid,
          version: process.version,
          platform: process.platform,
          arch: process.arch,
          uptime: process.uptime(),
          title: process.title,
        }
      },
      system: {
        status: 'healthy',
        details: {
          cwd: process.cwd(),
          env: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
          }
        }
      }
    };

    // Verificar limites de memória
    const memoryUsage = process.memoryUsage();
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    if (memoryPercent > 90) {
      checks.memory.status = 'warning';
      checks.memory.details.warning = 'High memory usage';
    }

    const responseTime = Date.now() - startTime;
    
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'AtendeAI Auth Service',
      version: '1.0.0',
      responseTime: `${responseTime}ms`,
      checks,
      summary: {
        total: Object.keys(checks).length,
        healthy: Object.values(checks).filter(c => c.status === 'healthy').length,
        warning: Object.values(checks).filter(c => c.status === 'warning').length,
        unhealthy: Object.values(checks).filter(c => c.status === 'unhealthy').length,
      }
    };

    // Determinar status geral
    const hasUnhealthy = Object.values(checks).some(c => c.status === 'unhealthy');
    const hasWarning = Object.values(checks).some(c => c.status === 'warning');
    
    if (hasUnhealthy) {
      detailedHealth.status = 'unhealthy';
      res.status(503);
    } else if (hasWarning) {
      detailedHealth.status = 'warning';
      res.status(200);
    }

    logger.info('Detailed health check completed', {
      status: detailedHealth.status,
      responseTime,
      summary: detailedHealth.summary,
    });

    res.json(detailedHealth);

  } catch (error) {
    logger.error('Detailed health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'AtendeAI Auth Service',
      error: error.message,
      checks: {
        database: 'unknown',
        redis: 'unknown',
        memory: 'unknown',
        process: 'unknown',
        system: 'unknown',
      },
    });
  }
});

// =====================================================
// HEALTH CHECK SIMPLES (APENAS STATUS)
// =====================================================
router.get('/status', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AtendeAI Auth Service',
  });
});

// =====================================================
// HEALTH CHECK PARA LOAD BALANCER
// =====================================================
router.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// =====================================================
// HEALTH CHECK PARA KONG
// =====================================================
router.get('/kong', async (req, res) => {
  try {
    const dbHealth = await database.healthCheck();
    const redisHealth = await redis.healthCheck();
    
    if (dbHealth.status === 'healthy' && redisHealth.status === 'healthy') {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: dbHealth.status,
        redis: redisHealth.status,
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

module.exports = router;
