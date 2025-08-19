const winston = require('winston');
const config = require('../config');

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'whatsapp-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error' 
  }));
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log' 
  }));
}

const logWithContext = (level, message, context = {}) => {
  const logData = {
    message,
    ...context,
    timestamp: new Date().toISOString(),
    service: 'whatsapp-service'
  };
  
  logger[level](logData);
};

module.exports = {
  info: (message, context) => logWithContext('info', message, context),
  error: (message, context) => logWithContext('error', message, context),
  warn: (message, context) => logWithContext('warn', message, context),
  debug: (message, context) => logWithContext('debug', message, context),
  log: (message, context) => logWithContext('info', message, context)
};
