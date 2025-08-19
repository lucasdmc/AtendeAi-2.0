const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const logger = require('./utils/logger');

// Importar rotas
const whatsappRoutes = require('./routes/whatsapp');

// Criar aplicação Express
const app = express();

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Middleware de CORS
app.use(cors({
  origin: config.security.allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Hub-Signature-256'],
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
app.use('/api/whatsapp', whatsappRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'WhatsApp Service',
    version: '1.0.0',
    description: 'Sistema de integração com WhatsApp Business API para AtendeAI 2.0',
    endpoints: {
      health: '/api/whatsapp/health',
      status: '/api/whatsapp/status',
      send_text: '/api/whatsapp/send/text',
      send_template: '/api/whatsapp/send/template',
      send_media: '/api/whatsapp/send/media',
      send_interactive: '/api/whatsapp/send/interactive',
      webhook: '/api/whatsapp/webhook',
      media_upload: '/api/whatsapp/media/upload',
      messages: '/api/whatsapp/messages',
      message_status: '/api/whatsapp/messages/:id/status',
      message_stats: '/api/whatsapp/messages/stats',
      recent_messages: '/api/whatsapp/messages/recent',
      unprocessed_messages: '/api/whatsapp/messages/unprocessed',
      connection_test: '/api/whatsapp/connection/test',
      account_info: '/api/whatsapp/account/info'
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

// Função para iniciar o servidor
const startServer = async () => {
  try {
    const server = app.listen(config.server.port, config.server.host, () => {
      logger.info('WhatsApp Service started successfully', {
        host: config.server.host,
        port: config.server.port,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
      });
    });

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
    logger.error('Failed to start WhatsApp Service', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};

// Iniciar servidor
startServer();

module.exports = app;
