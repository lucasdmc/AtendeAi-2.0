require('dotenv').config();

module.exports = {
  server: {
    port: process.env.WHATSAPP_SERVICE_PORT || 3004,
    host: process.env.WHATSAPP_SERVICE_HOST || '0.0.0.0'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'atendeai',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: process.env.REDIS_DB || 2,
    keyPrefix: 'whatsapp:'
  },
  whatsapp: {
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
    baseUrl: process.env.WHATSAPP_BASE_URL || 'https://graph.facebook.com',
    webhookPath: process.env.WHATSAPP_WEBHOOK_PATH || '/webhook/whatsapp',
    maxRetries: parseInt(process.env.WHATSAPP_MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.WHATSAPP_RETRY_DELAY) || 1000
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiration: process.env.JWT_EXPIRATION || '24h',
    refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '7d'
  },
  clinic: {
    serviceUrl: process.env.CLINIC_SERVICE_URL || 'http://localhost:3001',
    apiKey: process.env.CLINIC_SERVICE_API_KEY
  },
  conversation: {
    serviceUrl: process.env.CONVERSATION_SERVICE_URL || 'http://localhost:3003',
    apiKey: process.env.CONVERSATION_SERVICE_API_KEY
  },
  appointment: {
    serviceUrl: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3002',
    apiKey: process.env.APPOINTMENT_SERVICE_API_KEY
  },
  messaging: {
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'pt-BR',
    maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH) || 4096,
    rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE) || 60,
    mediaUploadPath: process.env.MEDIA_UPLOAD_PATH || './uploads',
    supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'video/mp4', 'application/pdf']
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP'
  },
  security: {
    webhookSignatureHeader: process.env.WEBHOOK_SIGNATURE_HEADER || 'x-hub-signature-256',
    webhookSignatureSecret: process.env.WEBHOOK_SIGNATURE_SECRET,
    allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*']
  }
};
