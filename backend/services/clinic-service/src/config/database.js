const { Pool } = require('pg');
const config = require('./index');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.pool = new Pool({
        connectionString: config.database.url,
        max: config.database.maxConnections,
        idleTimeoutMillis: config.database.idleTimeoutMillis,
        connectionTimeoutMillis: config.database.connectionTimeoutMillis,
        ssl: config.database.url.includes('supabase') ? {
          rejectUnauthorized: false
        } : false,
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      logger.info('Database connected successfully');
      
      // Handle pool errors
      this.pool.on('error', (err) => {
        logger.error('Unexpected error on idle client', err);
        this.isConnected = false;
      });

    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  async query(text, params) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Executed query', { 
        text: text.substring(0, 100), 
        duration, 
        rows: result.rowCount 
      });
      
      return result;
    } catch (error) {
      logger.error('Query execution failed:', { text, params, error: error.message });
      throw error;
    }
  }

  async getClient() {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    return this.pool.connect();
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      logger.info('Database connection closed');
    }
  }

  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as health');
      return result.rows[0].health === 1;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

module.exports = new Database();
