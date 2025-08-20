// =====================================================
// GOOGLE CALENDAR SERVICE - ATENDEAÍ 2.0
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
const googleCalendarRoutes = require('./routes/calendar');

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
  origin: config.cors?.origins || '*',
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
app.get('/health', (req, res) => {
  res.json({
    service: 'Google Calendar Service',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Rotas da API
app.use('/api/v1/calendar', googleCalendarRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    service: 'AtendeAI Google Calendar Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      calendar: '/api/v1/calendar',
    },
  });
});

// =====================================================
// MIDDLEWARE DE TRATAMENTO DE ERROS
// =====================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// =====================================================
// INICIALIZAÇÃO DO SERVIÇO
// =====================================================

const PORT = process.env.PORT || 3005;

async function startServer() {
  try {
    // Conectar ao banco de dados
    if (config.database?.enabled !== false) {
      await database.connect();
      logger.info('Database connected successfully');
    }

    // Conectar ao Redis
    if (config.redis?.enabled !== false) {
      await redis.connect();
      logger.info('Redis connected successfully');
    }

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      logger.info(`Google Calendar Service started on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();

module.exports = app;
