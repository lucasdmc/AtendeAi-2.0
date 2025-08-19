// =====================================================
// LOGGER - AUTH SERVICE
// ATENDEAI 2.0 - ENTREGÁVEL 1
// =====================================================

const winston = require('winston');
const config = require('../config');

// =====================================================
// FORMATOS DE LOG
// =====================================================

const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}] ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss.SSS'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}] ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// =====================================================
// TRANSPORTES
// =====================================================

const transports = [];

// Console transport para desenvolvimento
if (config.nodeEnv === 'development') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: config.logging.level,
    })
  );
}

// File transport para produção
if (config.nodeEnv === 'production') {
  transports.push(
    new winston.transports.File({
      filename: config.logging.file,
      format: logFormat,
      level: config.logging.level,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    })
  );
}

// =====================================================
// CRIAR LOGGER
// =====================================================

const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  exitOnError: false,
});

// =====================================================
// MÉTODOS DE LOGGING
// =====================================================

// Log de informação
const info = (message, meta = {}) => {
  logger.info(message, meta);
};

// Log de erro
const error = (message, meta = {}) => {
  logger.error(message, meta);
};

// Log de warning
const warn = (message, meta = {}) => {
  logger.warn(message, meta);
};

// Log de debug
const debug = (message, meta = {}) => {
  logger.debug(message, meta);
};

// Log de verbose
const verbose = (message, meta = {}) => {
  logger.verbose(message, meta);
};

// Log de silly
const silly = (message, meta = {}) => {
  logger.silly(message, meta);
};

// =====================================================
// LOGGING DE REQUESTS
// =====================================================

const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      clinicId: req.get('X-Clinic-ID'),
      userId: req.user?.id,
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

// =====================================================
// LOGGING DE ERROS
// =====================================================

const logError = (error, req = null, res = null) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code,
    ...(req && {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      clinicId: req.get('X-Clinic-ID'),
      userId: req.user?.id,
    }),
    ...(res && {
      statusCode: res.statusCode,
    }),
  };

  logger.error('Application Error', errorData);
};

// =====================================================
// LOGGING DE AUDITORIA
// =====================================================

const logAudit = (action, resource, resourceId, userId, clinicId, details = {}) => {
  const auditData = {
    action,
    resource,
    resourceId,
    userId,
    clinicId,
    details,
    timestamp: new Date().toISOString(),
  };

  logger.info('Audit Log', auditData);
};

// =====================================================
// LOGGING DE PERFORMANCE
// =====================================================

const logPerformance = (operation, duration, meta = {}) => {
  const perfData = {
    operation,
    duration: `${duration}ms`,
    ...meta,
  };

  if (duration > 1000) {
    logger.warn('Performance Warning', perfData);
  } else {
    logger.debug('Performance Log', perfData);
  }
};

// =====================================================
// LOGGING DE SEGURANÇA
// =====================================================

const logSecurity = (event, details = {}) => {
  const securityData = {
    event,
    details,
    timestamp: new Date().toISOString(),
    level: 'security',
  };

  logger.warn('Security Event', securityData);
};

// =====================================================
// EXPORTAR
// =====================================================

module.exports = {
  // Métodos básicos
  info,
  error,
  warn,
  debug,
  verbose,
  silly,
  
  // Métodos especializados
  logRequest,
  logError,
  logAudit,
  logPerformance,
  logSecurity,
  
  // Logger winston para uso direto
  logger,
};
