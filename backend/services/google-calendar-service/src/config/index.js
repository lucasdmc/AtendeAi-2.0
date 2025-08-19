require('dotenv').config();

module.exports = {
  server: {
    port: process.env.GOOGLE_CALENDAR_SERVICE_PORT || 3005,
    host: process.env.GOOGLE_CALENDAR_SERVICE_HOST || '0.0.0.0'
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
    db: process.env.REDIS_DB || 3,
    keyPrefix: 'google-calendar:'
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3005/auth/google/callback',
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly'
    ],
    apiKey: process.env.GOOGLE_API_KEY,
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    timezone: process.env.GOOGLE_TIMEZONE || 'America/Sao_Paulo',
    maxResults: parseInt(process.env.GOOGLE_MAX_RESULTS) || 100,
    syncInterval: parseInt(process.env.GOOGLE_SYNC_INTERVAL) || 300000, // 5 minutos
    retryAttempts: parseInt(process.env.GOOGLE_RETRY_ATTEMPTS) || 3,
    retryDelay: parseInt(process.env.GOOGLE_RETRY_DELAY) || 1000
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiration: process.env.JWT_EXPIRATION || '24h',
    refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 3600000 // 1 hora
  },
  clinic: {
    serviceUrl: process.env.CLINIC_SERVICE_URL || 'http://localhost:3001',
    apiKey: process.env.CLINIC_SERVICE_API_KEY
  },
  appointment: {
    serviceUrl: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3002',
    apiKey: process.env.APPOINTMENT_SERVICE_API_KEY
  },
  calendar: {
    defaultDuration: parseInt(process.env.DEFAULT_APPOINTMENT_DURATION) || 30, // minutos
    bufferTime: parseInt(process.env.BUFFER_TIME) || 15, // minutos
    workingHours: {
      start: process.env.WORKING_HOURS_START || '08:00',
      end: process.env.WORKING_HOURS_END || '18:00'
    },
    workingDays: process.env.WORKING_DAYS ? process.env.WORKING_DAYS.split(',') : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    holidays: process.env.HOLIDAYS ? JSON.parse(process.env.HOLIDAYS) : [],
    maxAdvanceBooking: parseInt(process.env.MAX_ADVANCE_BOOKING) || 90, // dias
    minAdvanceBooking: parseInt(process.env.MIN_ADVANCE_BOOKING) || 1 // horas
  },
  synchronization: {
    bidirectional: process.env.BIDIRECTIONAL_SYNC === 'true',
    autoSync: process.env.AUTO_SYNC === 'true',
    syncOnCreate: process.env.SYNC_ON_CREATE === 'true',
    syncOnUpdate: process.env.SYNC_ON_UPDATE === 'true',
    syncOnDelete: process.env.SYNC_ON_DELETE === 'true',
    conflictResolution: process.env.CONFLICT_RESOLUTION || 'local', // local, remote, manual
    batchSize: parseInt(process.env.SYNC_BATCH_SIZE) || 50,
    maxConcurrentSyncs: parseInt(process.env.MAX_CONCURRENT_SYNCS) || 5
  },
  webhook: {
    enabled: process.env.WEBHOOK_ENABLED === 'true',
    endpoint: process.env.WEBHOOK_ENDPOINT || '/webhook/google-calendar',
    secret: process.env.WEBHOOK_SECRET,
    maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.WEBHOOK_RETRY_DELAY) || 5000
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
    allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'],
    enableCors: process.env.ENABLE_CORS !== 'false',
    enableHelmet: process.env.ENABLE_HELMET !== 'false'
  },
  cron: {
    syncInterval: process.env.CRON_SYNC_INTERVAL || '*/5 * * * *', // A cada 5 minutos
    cleanupInterval: process.env.CRON_CLEANUP_INTERVAL || '0 2 * * *', // Diariamente às 2h
    healthCheckInterval: process.env.CRON_HEALTH_CHECK_INTERVAL || '*/15 * * * *' // A cada 15 minutos
  }
};
