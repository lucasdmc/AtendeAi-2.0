// =====================================================
// AUTH SERVICE - ENTREGÁVEL 1
// ATENDEAI 2.0
// =====================================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const logger = require('./utils/logger');
const database = require('./config/database');
const redis = require('./config/redis');

// Importar rotas
const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');

// Criar aplicação Express
const app = express();

// =====================================================
// MIDDLEWARE DE SEGURANÇA
// =====================================================

// Helmet para headers de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Clinic-ID'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite por IP
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// =====================================================
// MIDDLEWARE DE PROCESSAMENTO
// =====================================================

// Compressão
app.use(compression());

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Parse JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =====================================================
// ROTAS
// =====================================================

// Health check (sem autenticação)
app.use('/health', healthRoutes);

// Rotas de autenticação
app.use('/api/v1/auth', authRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    service: 'AtendeAI Auth Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// MIDDLEWARE DE ERRO
// =====================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Error handler global
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  
  res.status(error.status || 500).json({
    error: {
      message: error.message || 'Internal server error',
      ...(config.nodeEnv === 'development' && { stack: error.stack }),
    },
  });
});

// =====================================================
// INICIALIZAÇÃO
// =====================================================

async function startServer() {
  try {
    // Conectar ao banco de dados
    await database.connect();
    logger.info('✅ Database connected successfully');

    // Conectar ao Redis
    await redis.connect();
    logger.info('✅ Redis connected successfully');

    // Iniciar servidor
    const server = app.listen(config.port, config.host, () => {
      logger.info(`🚀 Auth Service running on http://${config.host}:${config.port}`);
      logger.info(`📊 Health check available at http://${config.host}:${config.port}/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      
      server.close(async () => {
        await database.disconnect();
        await redis.disconnect();
        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      
      server.close(async () => {
        await database.disconnect();
        await redis.disconnect();
        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();

module.exports = app;
