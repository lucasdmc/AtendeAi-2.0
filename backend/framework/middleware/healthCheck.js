// =====================================================
// HEALTH CHECK MIDDLEWARE - ATENDEAI 2.0
// Middleware padronizado para health checks
// =====================================================

const axios = require('axios');

class HealthCheckMiddleware {
  constructor(serviceName, dependencies = {}) {
    this.serviceName = serviceName;
    this.dependencies = dependencies;
    this.startTime = new Date();
    this.healthStatus = {
      status: 'healthy',
      timestamp: this.startTime.toISOString(),
      uptime: 0,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {}
    };
  }

  // Health check básico
  basicHealth(req, res) {
    const uptime = process.uptime();
    this.healthStatus.uptime = uptime;
    this.healthStatus.timestamp = new Date().toISOString();
    
    res.status(200).json({
      service: this.serviceName,
      status: 'healthy',
      timestamp: this.healthStatus.timestamp,
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      version: this.healthStatus.version,
      environment: this.healthStatus.environment
    });
  }

  // Health check detalhado com dependências
  detailedHealth(req, res) {
    this.performHealthChecks()
      .then(results => {
        const allHealthy = Object.values(results).every(check => check.status === 'healthy');
        const statusCode = allHealthy ? 200 : 503;
        
        this.healthStatus.checks = results;
        this.healthStatus.status = allHealthy ? 'healthy' : 'unhealthy';
        this.healthStatus.timestamp = new Date().toISOString();
        this.healthStatus.uptime = process.uptime();

        res.status(statusCode).json({
          service: this.serviceName,
          status: this.healthStatus.status,
          timestamp: this.healthStatus.timestamp,
          uptime: `${Math.floor(this.healthStatus.uptime / 3600)}h ${Math.floor((this.healthStatus.uptime % 3600) / 60)}m ${Math.floor(this.healthStatus.uptime % 60)}s`,
          version: this.healthStatus.version,
          environment: this.healthStatus.environment,
          checks: results
        });
      })
      .catch(error => {
        console.error('Health check error:', error);
        res.status(503).json({
          service: this.serviceName,
          status: 'error',
          timestamp: new Date().toISOString(),
          error: error.message
        });
      });
  }

  // Health check de readiness (pronto para receber tráfego)
  readinessCheck(req, res) {
    this.performReadinessChecks()
      .then(results => {
        const allReady = Object.values(results).every(check => check.status === 'ready');
        const statusCode = allReady ? 200 : 503;
        
        res.status(statusCode).json({
          service: this.serviceName,
          status: allReady ? 'ready' : 'not_ready',
          timestamp: new Date().toISOString(),
          checks: results
        });
      })
      .catch(error => {
        console.error('Readiness check error:', error);
        res.status(503).json({
          service: this.serviceName,
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          error: error.message
        });
      });
  }

  // Health check de liveness (serviço está vivo)
  livenessCheck(req, res) {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    res.status(200).json({
      service: this.serviceName,
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
      },
      pid: process.pid,
      nodeVersion: process.version
    });
  }

  // Executar verificações de saúde
  async performHealthChecks() {
    const results = {};
    
    // Verificar dependências
    for (const [name, config] of Object.entries(this.dependencies)) {
      try {
        results[name] = await this.checkDependency(name, config);
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }

    // Verificar recursos do sistema
    results.system = this.checkSystemResources();
    
    return results;
  }

  // Executar verificações de readiness
  async performReadinessChecks() {
    const results = {};
    
    // Verificar dependências críticas
    for (const [name, config] of Object.entries(this.dependencies)) {
      if (config.critical) {
        try {
          results[name] = await this.checkDependency(name, config);
        } catch (error) {
          results[name] = {
            status: 'not_ready',
            error: error.message,
            timestamp: new Date().toISOString()
          };
        }
      }
    }

    return results;
  }

  // Verificar dependência específica
  async checkDependency(name, config) {
    const startTime = Date.now();
    
    try {
      switch (config.type) {
        case 'database':
          return await this.checkDatabase(config);
        case 'redis':
          return await this.checkRedis(config);
        case 'http':
          return await this.checkHttpEndpoint(config);
        case 'tcp':
          return await this.checkTcpEndpoint(config);
        default:
          return {
            status: 'unknown',
            error: `Unknown dependency type: ${config.type}`,
            timestamp: new Date().toISOString()
          };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Verificar banco de dados
  async checkDatabase(config) {
    const startTime = Date.now();
    
    try {
      // Implementar verificação específica do banco
      // Por enquanto, retornar status básico
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: {
          type: 'postgresql',
          host: config.host || 'unknown',
          database: config.database || 'unknown'
        }
      };
    } catch (error) {
      throw new Error(`Database check failed: ${error.message}`);
    }
  }

  // Verificar Redis
  async checkRedis(config) {
    const startTime = Date.now();
    
    try {
      // Implementar verificação específica do Redis
      // Por enquanto, retornar status básico
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: {
          type: 'redis',
          host: config.host || 'unknown',
          port: config.port || 'unknown'
        }
      };
    } catch (error) {
      throw new Error(`Redis check failed: ${error.message}`);
    }
  }

  // Verificar endpoint HTTP
  async checkHttpEndpoint(config) {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(config.url, {
        timeout: config.timeout || 5000,
        validateStatus: status => status < 500
      });
      
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: {
          url: config.url,
          statusCode: response.status,
          statusText: response.statusText
        }
      };
    } catch (error) {
      throw new Error(`HTTP check failed: ${error.message}`);
    }
  }

  // Verificar endpoint TCP
  async checkTcpEndpoint(config) {
    const startTime = Date.now();
    
    try {
      // Implementar verificação TCP
      // Por enquanto, retornar status básico
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        details: {
          host: config.host || 'unknown',
          port: config.port || 'unknown'
        }
      };
    } catch (error) {
      throw new Error(`TCP check failed: ${error.message}`);
    }
  }

  // Verificar recursos do sistema
  checkSystemResources() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      details: {
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`
        },
        cpu: {
          user: `${Math.round(cpuUsage.user / 1000)}ms`,
          system: `${Math.round(cpuUsage.system / 1000)}ms`
        },
        uptime: `${Math.floor(process.uptime())}s`
      }
    };
  }

  // Configurar rotas de health check
  setupRoutes(app) {
    // Health check básico
    app.get('/health', (req, res) => this.basicHealth(req, res));
    
    // Health check detalhado
    app.get('/health/detailed', (req, res) => this.detailedHealth(req, res));
    
    // Readiness check
    app.get('/ready', (req, res) => this.readinessCheck(req, res));
    
    // Liveness check
    app.get('/live', (req, res) => this.livenessCheck(req, res));
  }
}

module.exports = HealthCheckMiddleware;
