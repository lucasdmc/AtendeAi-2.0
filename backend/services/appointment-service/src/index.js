const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const config = require('./config');
const logger = require('./utils/logger');

// Importar rotas
const appointmentRoutes = require('./routes/appointment');

// Criar aplicação Express
const app = express();

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Middleware de CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Middleware de compressão
app.use(compression());

// Middleware de logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Rate limiting
const limiter = rateLimit(config.rateLimit);
app.use('/api/', limiter);

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging de requisições
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Rotas da API
app.use('/api/appointment', appointmentRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'Appointment Service',
    version: '1.0.0',
    description: 'Sistema de agendamento inteligente para AtendeAI 2.0',
    endpoints: {
      health: '/api/appointment/health',
      status: '/api/appointment/status',
      flow_start: '/api/appointment/flow/start',
      flow_current: '/api/appointment/flow/current',
      services: '/api/appointment/services',
      professionals: '/api/appointment/professionals',
      dates: '/api/appointment/dates',
      times: '/api/appointment/times',
      confirm: '/api/appointment/flow/confirm',
      appointments: '/api/appointment/list',
      stats: '/api/appointment/stats',
      sync_calendar: '/api/appointment/sync/calendar'
    },
    documentation: 'Consulte a documentação da API para mais detalhes'
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `The route ${req.originalUrl} was not found on this server`,
    timestamp: new Date().toISOString()
  });
});

// Configurar cron jobs
const setupCronJobs = () => {
  try {
    // Limpeza de fluxos expirados
    cron.schedule(config.cron.cleanupInterval, async () => {
      logger.info('Running cleanup cron job');
      // Implementar limpeza de fluxos expirados
    });

    // Sincronização com Google Calendar
    cron.schedule(config.cron.syncInterval, async () => {
      logger.info('Running calendar sync cron job');
      // Implementar sincronização automática
    });

    logger.info('Cron jobs configured successfully');
  } catch (error) {
    logger.error('Error setting up cron jobs', { error: error.message });
  }
};

// Função para iniciar o servidor
const startServer = async () => {
  try {
    const server = app.listen(config.server.port, config.server.host, () => {
      logger.info('Appointment Service started successfully', {
        host: config.server.host,
        port: config.server.port,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
    });

    // Configurar cron jobs
    setupCronJobs();

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Tratamento de erros não capturados
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start Appointment Service', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

// Iniciar servidor
startServer();

module.exports = app;
