// =====================================================
// CONFIGURAÇÃO DO BANCO DE DADOS - AUTH SERVICE
// ATENDEAI 2.0 - ENTREGÁVEL 1
// =====================================================

const { Pool } = require('pg');
const config = require('./index');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  // =====================================================
  // CONEXÃO COM O BANCO
  // =====================================================
  async connect() {
    try {
      if (this.isConnected) {
        logger.info('Database already connected');
        return;
      }

      this.pool = new Pool({
        connectionString: config.database.url,
        max: config.database.maxConnections,
        idleTimeoutMillis: config.database.idleTimeoutMillis,
        connectionTimeoutMillis: config.database.connectionTimeoutMillis,
        ssl: config.database.url.includes('supabase') ? {
          rejectUnauthorized: false
        } : false,
      });

      // Testar conexão
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      logger.info('✅ Database connected successfully');

      // Event listeners para o pool
      this.pool.on('error', (err) => {
        logger.error('Unexpected error on idle client', err);
        this.isConnected = false;
      });

      this.pool.on('connect', (client) => {
        logger.debug('New client connected to database');
      });

      this.pool.on('remove', (client) => {
        logger.debug('Client removed from database pool');
      });

    } catch (error) {
      logger.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  // =====================================================
  // DESCONEXÃO DO BANCO
  // =====================================================
  async disconnect() {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
        this.isConnected = false;
        logger.info('✅ Database disconnected successfully');
      }
    } catch (error) {
      logger.error('❌ Error disconnecting from database:', error);
      throw error;
    }
  }

  // =====================================================
  // EXECUTAR QUERY
  // =====================================================
  async query(text, params) {
    try {
      if (!this.isConnected) {
        throw new Error('Database not connected');
      }

      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      logger.debug('Executed query', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration,
        rows: result.rowCount,
      });

      return result;
    } catch (error) {
      logger.error('❌ Database query error:', error);
      throw error;
    }
  }

  // =====================================================
  // EXECUTAR QUERY COM TRANSACTION
  // =====================================================
  async transaction(callback) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // =====================================================
  // VERIFICAR CONEXÃO
  // =====================================================
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', message: 'Database not connected' };
      }

      const result = await this.query('SELECT NOW() as timestamp, version() as version');
      
      return {
        status: 'healthy',
        timestamp: result.rows[0].timestamp,
        version: result.rows[0].version.split(' ')[1],
        connections: this.pool.totalCount,
        idle: this.pool.idleCount,
        waiting: this.pool.waitingCount,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  // =====================================================
  // GETTERS
  // =====================================================
  get isConnected() {
    return this._isConnected;
  }

  set isConnected(value) {
    this._isConnected = value;
  }

  get pool() {
    return this._pool;
  }

  set pool(value) {
    this._pool = value;
  }
}

// Exportar instância singleton
module.exports = new Database();
