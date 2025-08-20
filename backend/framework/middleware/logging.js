// =====================================================
// LOGGING MIDDLEWARE - ATENDEAI 2.0
// Sistema de logging centralizado e estruturado
// =====================================================

const winston = require('winston');
const { format } = winston;
const path = require('path');

class LoggingMiddleware {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.options = {
      level: process.env.LOG_LEVEL || 'info',
      logDir: process.env.LOG_DIR || 'logs',
      maxSize: process.env.LOG_MAX_SIZE || '20m',
      maxFiles: process.env.LOG_MAX_FILES || '14d',
      ...options
    };

    this.logger = this.createLogger();
  }

  // Criar logger configurado
  createLogger() {
    const logFormat = format.combine(
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      format.errors({ stack: true }),
      format.json(),
      format.printf(({ timestamp, level, message, service, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level.toUpperCase()}] [${service || this.serviceName}]: ${message} ${metaStr}`;
      })
    );

    const transports = [
      // Console transport para desenvolvimento
      new winston.transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple(),
          format.printf(({ timestamp, level, message, service, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
            return `${timestamp} [${level.toUpperCase()}] [${service || this.serviceName}]: ${message} ${metaStr}`;
          })
        )
      })
    ];

    // File transport para produção
    if (process.env.NODE_ENV === 'production') {
      transports.push(
        new winston.transports.File({
          filename: path.join(this.options.logDir, `${this.serviceName}-error.log`),
          level: 'error',
          maxsize: this.parseSize(this.options.maxSize),
          maxFiles: this.parseMaxFiles(this.options.maxFiles),
          format: logFormat
        }),
        new winston.transports.File({
          filename: path.join(this.options.logDir, `${this.serviceName}-combined.log`),
          maxsize: this.parseSize(this.options.maxSize),
          maxFiles: this.parseMaxFiles(this.options.maxFiles),
          format: logFormat
        })
      );
    }

    return winston.createLogger({
      level: this.options.level,
      format: logFormat,
      transports,
      exitOnError: false
    });
  }

  // Parse tamanho do arquivo de log
  parseSize(size) {
    const units = {
      'b': 1,
      'kb': 1024,
      'mb': 1024 * 1024,
      'gb': 1024 * 1024 * 1024
    };

    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
    if (match) {
      return parseInt(match[1]) * units[match[2]];
    }
    return 20 * 1024 * 1024; // 20MB padrão
  }

  // Parse número máximo de arquivos
  parseMaxFiles(maxFiles) {
    if (typeof maxFiles === 'string' && maxFiles.endsWith('d')) {
      return maxFiles;
    }
    return parseInt(maxFiles) || 14;
  }

  // Log de requisição HTTP
  logRequest(req, res, next) {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || this.generateRequestId();

    // Adicionar request ID ao objeto req
    req.requestId = requestId;

    // Log da requisição recebida
    this.logger.info('HTTP Request received', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      headers: this.sanitizeHeaders(req.headers),
      body: this.sanitizeBody(req.body),
      timestamp: new Date().toISOString()
    });

    // Interceptar resposta para log
    const originalSend = res.send;
    res.send = function(data) {
      const responseTime = Date.now() - startTime;
      
      // Log da resposta enviada
      this.logger.info('HTTP Response sent', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        responseSize: data ? data.length : 0,
        timestamp: new Date().toISOString()
      });

      // Chamar método original
      return originalSend.call(this, data);
    }.bind(this);

    next();
  }

  // Log de erro
  logError(error, req = null, res = null) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      timestamp: new Date().toISOString()
    };

    if (req) {
      errorInfo.requestId = req.requestId;
      errorInfo.method = req.method;
      errorInfo.url = req.url;
      errorInfo.ip = req.ip || req.connection.remoteAddress;
      errorInfo.userAgent = req.get('User-Agent');
    }

    this.logger.error('Error occurred', errorInfo);
  }

  // Log de performance
  logPerformance(operation, duration, metadata = {}) {
    this.logger.info('Performance metric', {
      operation,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  // Log de negócio
  logBusinessEvent(event, data = {}) {
    this.logger.info('Business event', {
      event,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  // Log de segurança
  logSecurityEvent(event, data = {}) {
    this.logger.warn('Security event', {
      event,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  // Log de auditoria
  logAuditEvent(action, resource, userId, details = {}) {
    this.logger.info('Audit event', {
      action,
      resource,
      userId,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  // Sanitizar headers sensíveis
  sanitizeHeaders(headers) {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    const sanitized = { ...headers };

    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  // Sanitizar body sensível
  sanitizeBody(body) {
    if (!body) return body;

    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    const sanitized = { ...body };

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  // Gerar ID único para requisição
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Middleware para logging automático
  middleware() {
    return (req, res, next) => {
      this.logRequest(req, res, next);
    };
  }

  // Middleware para logging de erros
  errorMiddleware() {
    return (error, req, res, next) => {
      this.logError(error, req, res);
      next(error);
    };
  }

  // Middleware para logging de performance
  performanceMiddleware(operation) {
    return (req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.logPerformance(operation, duration, {
          requestId: req.requestId,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode
        });
      });

      next();
    };
  }

  // Métodos de conveniência para diferentes níveis de log
  debug(message, meta = {}) {
    this.logger.debug(message, { service: this.serviceName, ...meta });
  }

  info(message, meta = {}) {
    this.logger.info(message, { service: this.serviceName, ...meta });
  }

  warn(message, meta = {}) {
    this.logger.warn(message, { service: this.serviceName, ...meta });
  }

  error(message, meta = {}) {
    this.logger.error(message, { service: this.serviceName, ...meta });
  }

  // Método para fechar logger
  close() {
    this.logger.close();
  }
}

module.exports = LoggingMiddleware;
