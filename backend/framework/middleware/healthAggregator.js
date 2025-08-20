// =====================================================
// HEALTH AGGREGATOR MIDDLEWARE - ATENDEAI 2.0
// Dashboard agregado de saúde para todos os serviços
// =====================================================

const axios = require('axios');

class HealthAggregatorMiddleware {
  constructor(services = []) {
    this.services = services;
    this.healthCache = new Map();
    this.cacheTimeout = 30000; // 30 segundos
  }

  // Adicionar serviço para monitoramento
  addService(name, config) {
    this.services.push({
      name,
      ...config
    });
  }

  // Verificar saúde de um serviço específico
  async checkServiceHealth(service) {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${service.url}/health`, {
        timeout: service.timeout || 5000,
        validateStatus: status => status < 500
      });

      const responseTime = Date.now() - startTime;
      
      return {
        name: service.name,
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        details: response.data,
        url: service.url
      };
    } catch (error) {
      return {
        name: service.name,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
        url: service.url
      };
    }
  }

  // Verificar saúde de todos os serviços
  async checkAllServicesHealth() {
    const healthChecks = await Promise.allSettled(
      this.services.map(service => this.checkServiceHealth(service))
    );

    const results = healthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const service = this.services[index];
        return {
          name: service.name,
          status: 'error',
          error: result.reason.message,
          timestamp: new Date().toISOString(),
          url: service.url
        };
      }
    });

    return results;
  }

  // Obter status agregado do sistema
  async getSystemHealth() {
    const servicesHealth = await this.checkAllServicesHealth();
    const overallStatus = this.calculateOverallStatus(servicesHealth);
    
    return {
      system: {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        totalServices: this.services.length,
        healthyServices: servicesHealth.filter(s => s.status === 'healthy').length,
        unhealthyServices: servicesHealth.filter(s => s.status !== 'healthy').length
      },
      services: servicesHealth,
      summary: this.generateHealthSummary(servicesHealth)
    };
  }

  // Calcular status geral do sistema
  calculateOverallStatus(servicesHealth) {
    const criticalServices = this.services.filter(s => s.critical);
    const criticalHealth = servicesHealth.filter(s => 
      criticalServices.find(cs => cs.name === s.name) && s.status === 'healthy'
    );

    if (criticalServices.length === 0) {
      return 'unknown';
    }

    if (criticalHealth.length === criticalServices.length) {
      return 'healthy';
    } else if (criticalHealth.length === 0) {
      return 'critical';
    } else {
      return 'degraded';
    }
  }

  // Gerar resumo de saúde
  generateHealthSummary(servicesHealth) {
    const summary = {
      healthy: [],
      unhealthy: [],
      error: [],
      degraded: []
    };

    servicesHealth.forEach(service => {
      if (service.status === 'healthy') {
        summary.healthy.push(service.name);
      } else if (service.status === 'unhealthy') {
        summary.unhealthy.push(service.name);
      } else if (service.status === 'error') {
        summary.error.push(service.name);
      } else {
        summary.degraded.push(service.name);
      }
    });

    return summary;
  }

  // Verificar dependências críticas
  async checkCriticalDependencies() {
    const criticalServices = this.services.filter(s => s.critical);
    const healthChecks = await Promise.allSettled(
      criticalServices.map(service => this.checkServiceHealth(service))
    );

    const results = healthChecks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const service = criticalServices[index];
        return {
          name: service.name,
          status: 'error',
          error: result.reason.message,
          timestamp: new Date().toISOString(),
          url: service.url
        };
      }
    });

    return {
      critical: results,
      allHealthy: results.every(r => r.status === 'healthy'),
      timestamp: new Date().toISOString()
    };
  }

  // Verificar conectividade de rede
  async checkNetworkConnectivity() {
    const networkChecks = await Promise.allSettled([
      this.checkExternalConnectivity(),
      this.checkDatabaseConnectivity(),
      this.checkRedisConnectivity()
    ]);

    return {
      external: networkChecks[0].status === 'fulfilled' ? networkChecks[0].value : { status: 'error', error: networkChecks[0].reason.message },
      database: networkChecks[1].status === 'fulfilled' ? networkChecks[1].value : { status: 'error', error: networkChecks[1].reason.message },
      redis: networkChecks[2].status === 'fulfilled' ? networkChecks[2].value : { status: 'error', error: networkChecks[2].reason.message },
      timestamp: new Date().toISOString()
    };
  }

  // Verificar conectividade externa
  async checkExternalConnectivity() {
    try {
      const startTime = Date.now();
      await axios.get('https://httpbin.org/status/200', { timeout: 5000 });
      const responseTime = Date.now() - startTime;

      return {
        status: 'connected',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Verificar conectividade do banco
  async checkDatabaseConnectivity() {
    // Implementar verificação específica do banco
    return {
      status: 'unknown',
      timestamp: new Date().toISOString()
    };
  }

  // Verificar conectividade do Redis
  async checkRedisConnectivity() {
    // Implementar verificação específica do Redis
    return {
      status: 'unknown',
      timestamp: new Date().toISOString()
    };
  }

  // Middleware para endpoint de saúde agregado
  aggregatedHealthMiddleware() {
    return async (req, res) => {
      try {
        const systemHealth = await this.getSystemHealth();
        const criticalDeps = await this.checkCriticalDependencies();
        const networkHealth = await this.checkNetworkConnectivity();

        const aggregatedHealth = {
          ...systemHealth,
          criticalDependencies: criticalDeps,
          network: networkHealth,
          timestamp: new Date().toISOString()
        };

        // Determinar status HTTP baseado na saúde do sistema
        const httpStatus = this.determineHttpStatus(aggregatedHealth.system.status);
        
        res.status(httpStatus).json(aggregatedHealth);
      } catch (error) {
        res.status(503).json({
          system: {
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          }
        });
      }
    };
  }

  // Determinar status HTTP baseado na saúde do sistema
  determineHttpStatus(systemStatus) {
    switch (systemStatus) {
      case 'healthy':
        return 200;
      case 'degraded':
        return 200; // Ainda funcional
      case 'critical':
        return 503; // Service Unavailable
      default:
        return 503;
    }
  }

  // Middleware para endpoint de readiness
  readinessMiddleware() {
    return async (req, res) => {
      try {
        const criticalDeps = await this.checkCriticalDependencies();
        
        if (criticalDeps.allHealthy) {
          res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString(),
            criticalDependencies: criticalDeps
          });
        } else {
          res.status(503).json({
            status: 'not_ready',
            timestamp: new Date().toISOString(),
            criticalDependencies: criticalDeps
          });
        }
      } catch (error) {
        res.status(503).json({
          status: 'not_ready',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  // Middleware para endpoint de liveness
  livenessMiddleware() {
    return (req, res) => {
      res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        pid: process.pid
      });
    };
  }

  // Configurar rotas de health check agregado
  setupRoutes(app) {
    // Health check agregado
    app.get('/health/aggregated', this.aggregatedHealthMiddleware());
    
    // Readiness check agregado
    app.get('/ready/aggregated', this.readinessMiddleware());
    
    // Liveness check agregado
    app.get('/live/aggregated', this.livenessMiddleware());
  }

  // Atualizar cache de saúde
  async updateHealthCache() {
    const systemHealth = await this.getSystemHealth();
    this.healthCache.set('system', {
      data: systemHealth,
      timestamp: Date.now()
    });
  }

  // Obter dados do cache
  getCachedHealth() {
    const cached = this.healthCache.get('system');
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  // Limpar cache
  clearCache() {
    this.healthCache.clear();
  }
}

module.exports = HealthAggregatorMiddleware;
