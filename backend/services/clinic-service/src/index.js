const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const db = require('./config/database');
const redis = require('./config/redis');
const logger = require('./utils/logger');

const clinicRoutes = require('./routes/clinic');
const professionalRoutes = require('./routes/professional');
const serviceRoutes = require('./routes/service');
const healthRoutes = require('./routes/health');

class ClinicService {
  constructor() {
    this.app = express();
    this.server = null;
    this.isShuttingDown = false;
  }

  async initialize() {
    try {
      logger.info('Initializing Clinic Service...');
      
      await this.setupDatabase();
      await this.setupRedis();
      await this.setupMiddleware();
      await this.setupRoutes();
      await this.setupErrorHandling();
      
      logger.info('Clinic Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Clinic Service:', error);
      throw error;
    }
  }

  async setupDatabase() {
    try {
      await db.connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  async setupRedis() {
    // try {
    //   await redis.connect();
    //   logger.info('Redis connected successfully');
    // } catch (error) {
    //   logger.warn('Redis connection failed, continuing without Redis:', error.message);
    // }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
      credentials: true
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use(morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim())
      }
    }));

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.id = require('crypto').randomUUID();
      res.setHeader('X-Request-ID', req.id);
      next();
    });

    // Request timing middleware
    this.app.use((req, res, next) => {
      req.startTime = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        logger.info('Request completed', {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          requestId: req.id
        });
      });
      next();
    });
  }

  setupRoutes() {
    // Health check routes (no auth required)
    this.app.use('/health', healthRoutes);
    
    // API routes
    this.app.use('/api/clinics', clinicRoutes);
    this.app.use('/api/clinics', professionalRoutes);
    this.app.use('/api/clinics', serviceRoutes);
    
    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        service: 'AtendeAI Clinic Service',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          clinics: '/api/clinics',
          professionals: '/api/clinics/:clinicId/professionals',
          services: '/api/clinics/:clinicId/services'
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        requestId: req.id
      });
    });
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error:', {
        error: error.message,
        stack: error.stack,
        requestId: req.id,
        method: req.method,
        url: req.url
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
        requestId: req.id,
        timestamp: new Date().toISOString()
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.gracefulShutdown();
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown();
    });
  }

  async start() {
    try {
      await this.initialize();
      
      this.server = this.app.listen(config.port, () => {
        logger.info(`Clinic Service started on port ${config.port}`);
        logger.info(`Environment: ${config.nodeEnv}`);
        logger.info(`Health check: http://localhost:${config.port}/health`);
      });
      
      this.server.on('error', (error) => {
        logger.error('Server error:', error);
        throw error;
      });
      
    } catch (error) {
      logger.error('Failed to start Clinic Service:', error);
      process.exit(1);
    }
  }

  async gracefulShutdown() {
    if (this.isShuttingDown) {
      return;
    }
    
    this.isShuttingDown = true;
    logger.info('Graceful shutdown initiated...');
    
    try {
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
        });
      }
      
      await db.close();
      await redis.close();
      
      logger.info('Clinic Service shutdown completed');
      process.exit(0);
      
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the service if this file is run directly
if (require.main === module) {
  const service = new ClinicService();
  service.start();
}

module.exports = ClinicService;
