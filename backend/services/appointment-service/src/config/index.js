require('dotenv').config();

module.exports = {
  server: {
    port: process.env.APPOINTMENT_SERVICE_PORT || 3002,
    host: process.env.APPOINTMENT_SERVICE_HOST || '0.0.0.0'
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
    db: process.env.REDIS_DB || 1,
    keyPrefix: 'appointment:'
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary'
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
    defaultDuration: parseInt(process.env.DEFAULT_APPOINTMENT_DURATION) || 30,
    minAdvanceNotice: parseInt(process.env.MIN_ADVANCE_NOTICE_HOURS) || 2,
    maxAdvanceNotice: parseInt(process.env.MAX_ADVANCE_NOTICE_DAYS) || 90,
    maxDailyAppointments: parseInt(process.env.MAX_DAILY_APPOINTMENTS) || 50,
    timezone: process.env.DEFAULT_TIMEZONE || 'America/Sao_Paulo'
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
  cron: {
    cleanupInterval: process.env.CLEANUP_CRON_INTERVAL || '0 2 * * *',
    syncInterval: process.env.SYNC_CRON_INTERVAL || '*/15 * * * *'
  }
};
