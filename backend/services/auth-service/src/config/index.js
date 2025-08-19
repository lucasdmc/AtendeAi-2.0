// =====================================================
// CONFIGURAÇÃO - AUTH SERVICE
// ATENDEAI 2.0 - ENTREGÁVEL 1
// =====================================================

require('dotenv').config();

module.exports = {
  // =====================================================
  // CONFIGURAÇÕES DO SERVIDOR
  // =====================================================
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  host: process.env.HOST || '0.0.0.0',

  // =====================================================
  // CONFIGURAÇÕES DO BANCO DE DADOS
  // =====================================================
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/atendeai',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS, 10) || 20,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 2000,
  },

  // =====================================================
  // CONFIGURAÇÕES DO REDIS
  // =====================================================
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || 'redis123',
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
  },

  // =====================================================
  // CONFIGURAÇÕES JWT
  // =====================================================
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
    algorithm: 'HS256',
  },

  // =====================================================
  // CONFIGURAÇÕES DE SEGURANÇA
  // =====================================================
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-in-production',
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutos
    rateLimitMax: 100, // máximo de requests por IP
  },

  // =====================================================
  // CONFIGURAÇÕES SUPABASE
  // =====================================================
  supabase: {
    url: process.env.SUPABASE_URL || 'https://kytphnasmdvebmdvvwtx.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjI4MTAsImV4cCI6MjA3MTE5ODgxMH0.gfH3VNqxLZWAbjlrlk44VrBdyF1QKv7CyOSLmhFwbqA',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYyMjgxMCwiZXhwIjoyMDcxMTk4ODEwfQ.36Ip9NWvqh6aeFQeowV79r54C2YQPc5N-Mn_dn2qD70',
  },

  // =====================================================
  // CONFIGURAÇÕES CORS
  // =====================================================
  cors: {
    origins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Clinic-ID'],
    exposedHeaders: ['Authorization', 'X-Clinic-ID'],
    maxAge: 3600,
  },

  // =====================================================
  // CONFIGURAÇÕES DE LOGGING
  // =====================================================
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    file: process.env.LOG_FILE || 'logs/auth-service.log',
  },

  // =====================================================
  // CONFIGURAÇÕES DE AUDITORIA
  // =====================================================
  audit: {
    enabled: process.env.AUDIT_LOG_ENABLED === 'true',
    retentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS, 10) || 180,
  },

  // =====================================================
  // CONFIGURAÇÕES MULTI-TENANT
  // =====================================================
  multiTenant: {
    enabled: process.env.TENANT_ISOLATION_ENABLED === 'true',
    headerName: process.env.TENANT_ID_HEADER || 'X-Clinic-ID',
    cookieName: process.env.TENANT_ID_COOKIE || 'clinic_id',
  },

  // =====================================================
  // CONFIGURAÇÕES DE PERFORMANCE
  // =====================================================
  performance: {
    compressionThreshold: 1024,
    compressionLevel: 6,
    jsonLimit: '10mb',
    urlencodedLimit: '10mb',
  },
};
