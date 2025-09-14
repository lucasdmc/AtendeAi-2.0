require('dotenv').config();

module.exports = {
  port: process.env.CLINIC_SERVICE_PORT || 3002,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/atendeai',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 20,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 2000,
  },
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: process.env.REDIS_DB || 0,
    keyPrefix: 'clinic:',
    ttl: parseInt(process.env.REDIS_TTL) || 3600
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
  },
  
  // File Upload
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    uploadDir: process.env.UPLOAD_DIR || './uploads'
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  }
};
