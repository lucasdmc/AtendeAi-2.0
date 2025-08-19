const db = require('../config/database');
const logger = require('../utils/logger');

class Message {
  static async create(messageData) {
    const { 
      conversation_id, 
      clinic_id,
      patient_phone,
      content, 
      type = 'text', 
      direction = 'inbound',
      metadata = {},
      timestamp = new Date()
    } = messageData;

    const query = `
      INSERT INTO messages (conversation_id, clinic_id, patient_phone, content, type, direction, metadata, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        conversation_id, 
        clinic_id,
        patient_phone,
        content, 
        type, 
        direction, 
        JSON.stringify(metadata), 
        timestamp
      ]);
      
      logger.info('Message created', { 
        message_id: result.rows[0].id,
        conversation_id,
        direction,
        type
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating message', { error: error.message, messageData });
      throw error;
    }
  }

  static async findByConversation(conversation_id, limit = 100, offset = 0) {
    const query = `
      SELECT * FROM messages 
      WHERE conversation_id = $1 
      ORDER BY timestamp ASC 
      LIMIT $2 OFFSET $3
    `;

    try {
      const result = await db.query(query, [conversation_id, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding messages by conversation', { 
        error: error.message, 
        conversation_id 
      });
      throw error;
    }
  }

  static async findByPhone(clinic_id, patient_phone, limit = 100, offset = 0) {
    const query = `
      SELECT * FROM messages 
      WHERE clinic_id = $1 AND patient_phone = $2 
      ORDER BY timestamp DESC 
      LIMIT $3 OFFSET $4
    `;

    try {
      const result = await db.query(query, [clinic_id, patient_phone, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding messages by phone', { 
        error: error.message, 
        clinic_id, 
        patient_phone 
      });
      throw error;
    }
  }

  static async getLastMessages(clinic_id, patient_phone, count = 10) {
    const query = `
      SELECT * FROM messages 
      WHERE clinic_id = $1 AND patient_phone = $2 
      ORDER BY timestamp DESC 
      LIMIT $3
    `;

    try {
      const result = await db.query(query, [clinic_id, patient_phone, count]);
      return result.rows.reverse();
    } catch (error) {
      logger.error('Error getting last messages', { 
        error: error.message, 
        clinic_id, 
        patient_phone 
      });
      throw error;
    }
  }

  static async update(id, updateData) {
    const { 
      content, 
      type, 
      direction, 
      metadata, 
      timestamp 
    } = updateData;

    const query = `
      UPDATE messages 
      SET content = $1, type = $2, direction = $3, metadata = $4, timestamp = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        content, 
        type, 
        direction, 
        JSON.stringify(metadata), 
        timestamp, 
        id
      ]);
      
      if (result.rows.length === 0) {
        throw new Error('Message not found');
      }
      
      logger.info('Message updated', { 
        message_id: id, 
        content, 
        type 
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating message', { error: error.message, id, updateData });
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM messages WHERE id = $1 RETURNING *';

    try {
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('Message not found');
      }
      
      logger.info('Message deleted', { message_id: id });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting message', { error: error.message, id });
      throw error;
    }
  }

  static async deleteByConversation(conversation_id) {
    const query = 'DELETE FROM messages WHERE conversation_id = $1 RETURNING COUNT(*)';

    try {
      const result = await db.query(query, [conversation_id]);
      const deletedCount = parseInt(result.rows[0].count);
      
      logger.info('Messages deleted by conversation', { 
        conversation_id, 
        deleted_count: deletedCount 
      });
      
      return deletedCount;
    } catch (error) {
      logger.error('Error deleting messages by conversation', { error: error.message, conversation_id });
      throw error;
    }
  }

  static async getConversationContext(clinic_id, patient_phone, messageCount = 20) {
    const query = `
      SELECT m.*, c.patient_name, c.status as conversation_status
      FROM messages m
      LEFT JOIN conversations c ON m.conversation_id = c.id
      WHERE m.clinic_id = $1 AND m.patient_phone = $2 
      ORDER BY m.timestamp DESC 
      LIMIT $3
    `;

    try {
      const result = await db.query(query, [clinic_id, patient_phone, messageCount]);
      return result.rows.reverse();
    } catch (error) {
      logger.error('Error getting conversation context', { 
        error: error.message, 
        clinic_id, 
        patient_phone 
      });
      throw error;
    }
  }
}

module.exports = Message;
