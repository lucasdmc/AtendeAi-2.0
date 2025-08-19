const db = require('../config/database');
const logger = require('../utils/logger');

class Conversation {
  static async create(conversationData) {
    const { 
      clinic_id, 
      patient_phone, 
      patient_name, 
      status = 'active',
      last_message = '',
      last_message_at = new Date()
    } = conversationData;

    const query = `
      INSERT INTO conversations (clinic_id, patient_phone, patient_name, status, last_message, last_message_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        clinic_id, 
        patient_phone, 
        patient_name, 
        status, 
        last_message, 
        last_message_at
      ]);
      
      logger.info('Conversation created', { 
        conversation_id: result.rows[0].id,
        clinic_id,
        patient_phone 
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating conversation', { error: error.message, conversationData });
      throw error;
    }
  }

  static async findByPhone(clinic_id, patient_phone) {
    const query = `
      SELECT * FROM conversations 
      WHERE clinic_id = $1 AND patient_phone = $2 
      ORDER BY last_message_at DESC 
      LIMIT 1
    `;

    try {
      const result = await db.query(query, [clinic_id, patient_phone]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding conversation by phone', { 
        error: error.message, 
        clinic_id, 
        patient_phone 
      });
      throw error;
    }
  }

  static async update(id, updateData) {
    const { 
      status, 
      last_message, 
      last_message_at = new Date() 
    } = updateData;

    const query = `
      UPDATE conversations 
      SET status = $1, last_message = $2, last_message_at = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;

    try {
      const result = await db.query(query, [status, last_message, last_message_at, id]);
      
      if (result.rows.length === 0) {
        throw new Error('Conversation not found');
      }
      
      logger.info('Conversation updated', { 
        conversation_id: id, 
        status, 
        last_message 
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating conversation', { error: error.message, id, updateData });
      throw error;
    }
  }

  static async updateLastMessage(id, message) {
    const query = `
      UPDATE conversations 
      SET last_message = $1, last_message_at = NOW(), updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    try {
      const result = await db.query(query, [message, id]);
      
      if (result.rows.length === 0) {
        throw new Error('Conversation not found');
      }
      
      logger.info('Conversation last message updated', { 
        conversation_id: id, 
        message 
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating conversation last message', { error: error.message, id, message });
      throw error;
    }
  }

  static async findByClinic(clinic_id, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM conversations 
      WHERE clinic_id = $1 
      ORDER BY last_message_at DESC 
      LIMIT $2 OFFSET $3
    `;

    try {
      const result = await db.query(query, [clinic_id, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding conversations by clinic', { 
        error: error.message, 
        clinic_id 
      });
      throw error;
    }
  }

  static async getActiveConversations(clinic_id) {
    const query = `
      SELECT * FROM conversations 
      WHERE clinic_id = $1 AND status = 'active'
      ORDER BY last_message_at DESC
    `;

    try {
      const result = await db.query(query, [clinic_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting active conversations', { 
        error: error.message, 
        clinic_id 
      });
      throw error;
    }
  }

  static async closeConversation(id) {
    const query = `
      UPDATE conversations 
      SET status = 'closed', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    try {
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Conversation not found');
      }
      
      logger.info('Conversation closed', { conversation_id: id });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error closing conversation', { error: error.message, id });
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM conversations WHERE id = $1 RETURNING *';

    try {
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Conversation not found');
      }
      
      logger.info('Conversation deleted', { conversation_id: id });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting conversation', { error: error.message, id });
      throw error;
    }
  }
}

module.exports = Conversation;
