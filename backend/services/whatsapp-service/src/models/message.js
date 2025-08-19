const db = require('../config/database');
const logger = require('../utils/logger');

class Message {
  static async create(messageData) {
    const { 
      clinic_id, 
      patient_phone, 
      patient_name,
      message_type, 
      content, 
      direction,
      whatsapp_message_id,
      conversation_id,
      metadata = {},
      status = 'received'
    } = messageData;

    const query = `
      INSERT INTO whatsapp_messages (
        clinic_id, patient_phone, patient_name, message_type, content, 
        direction, whatsapp_message_id, conversation_id, metadata, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        clinic_id, patient_phone, patient_name, message_type, content,
        direction, whatsapp_message_id, conversation_id, JSON.stringify(metadata), status
      ]);
      
      logger.info('WhatsApp message created', { 
        message_id: result.rows[0].id,
        clinic_id,
        patient_phone,
        message_type,
        direction
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating WhatsApp message', { error: error.message, messageData });
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM whatsapp_messages WHERE id = $1';

    try {
      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding WhatsApp message by id', { error: error.message, id });
      throw error;
    }
  }

  static async findByWhatsAppId(whatsapp_message_id) {
    const query = 'SELECT * FROM whatsapp_messages WHERE whatsapp_message_id = $1';

    try {
      const result = await db.query(query, [whatsapp_message_id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error finding WhatsApp message by WhatsApp ID', { error: error.message, whatsapp_message_id });
      throw error;
    }
  }

  static async findByConversation(conversation_id, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM whatsapp_messages 
      WHERE conversation_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    try {
      const result = await db.query(query, [conversation_id, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding WhatsApp messages by conversation', { error: error.message, conversation_id });
      throw error;
    }
  }

  static async findByPatient(clinic_id, patient_phone, limit = 50, offset = 0) {
    const query = `
      SELECT * FROM whatsapp_messages 
      WHERE clinic_id = $1 AND patient_phone = $2
      ORDER BY created_at DESC
      LIMIT $3 OFFSET $4
    `;

    try {
      const result = await db.query(query, [clinic_id, patient_phone, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error finding WhatsApp messages by patient', { error: error.message, clinic_id, patient_phone });
      throw error;
    }
  }

  static async updateStatus(id, new_status, metadata = {}) {
    const query = `
      UPDATE whatsapp_messages 
      SET status = $1, metadata = metadata || $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    try {
      const result = await db.query(query, [new_status, JSON.stringify(metadata), id]);
      
      if (result.rows.length === 0) {
        throw new Error('WhatsApp message not found');
      }
      
      logger.info('WhatsApp message status updated', { 
        message_id: id, 
        old_status: result.rows[0].status, 
        new_status 
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating WhatsApp message status', { error: error.message, id, new_status });
      throw error;
    }
  }

  static async update(id, updateData) {
    const { 
      content, 
      metadata, 
      status 
    } = updateData;

    const query = `
      UPDATE whatsapp_messages 
      SET 
        content = COALESCE($1, content),
        metadata = COALESCE($2, metadata),
        status = COALESCE($3, status),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;

    try {
      const result = await db.query(query, [
        content, 
        metadata ? JSON.stringify(metadata) : null, 
        status, 
        id
      ]);
      
      if (result.rows.length === 0) {
        throw new Error('WhatsApp message not found');
      }
      
      logger.info('WhatsApp message updated', { 
        message_id: id, 
        update_fields: Object.keys(updateData).filter(key => updateData[key] !== undefined)
      });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating WhatsApp message', { error: error.message, id, updateData });
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM whatsapp_messages WHERE id = $1 RETURNING *';

    try {
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new Error('WhatsApp message not found');
      }
      
      logger.info('WhatsApp message deleted', { message_id: id });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting WhatsApp message', { error: error.message, id });
      throw error;
    }
  }

  static async getMessageStats(clinic_id, start_date, end_date) {
    const query = `
      SELECT 
        message_type,
        direction,
        status,
        COUNT(*) as count,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
      FROM whatsapp_messages
      WHERE clinic_id = $1 
      AND created_at >= $2 
      AND created_at <= $3
      GROUP BY message_type, direction, status
      ORDER BY count DESC
    `;

    try {
      const result = await db.query(query, [clinic_id, start_date, end_date]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting WhatsApp message stats', { error: error.message, clinic_id, start_date, end_date });
      throw error;
    }
  }

  static async getRecentMessages(clinic_id, hours = 24) {
    const query = `
      SELECT * FROM whatsapp_messages 
      WHERE clinic_id = $1 
      AND created_at >= NOW() - INTERVAL '1 hour' * $2
      ORDER BY created_at DESC
    `;

    try {
      const result = await db.query(query, [clinic_id, hours]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting recent WhatsApp messages', { error: error.message, clinic_id, hours });
      throw error;
    }
  }

  static async getUnprocessedMessages(clinic_id, limit = 100) {
    const query = `
      SELECT * FROM whatsapp_messages 
      WHERE clinic_id = $1 
      AND status = 'received'
      AND direction = 'inbound'
      ORDER BY created_at ASC
      LIMIT $2
    `;

    try {
      const result = await db.query(query, [clinic_id, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting unprocessed WhatsApp messages', { error: error.message, clinic_id });
      throw error;
    }
  }

  static async markAsProcessed(id, processing_result = {}) {
    const query = `
      UPDATE whatsapp_messages 
      SET 
        status = 'processed', 
        metadata = metadata || $1, 
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;

    try {
      const result = await db.query(query, [JSON.stringify(processing_result), id]);
      
      if (result.rows.length === 0) {
        throw new Error('WhatsApp message not found');
      }
      
      logger.info('WhatsApp message marked as processed', { message_id: id });
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error marking WhatsApp message as processed', { error: error.message, id });
      throw error;
    }
  }
}

module.exports = Message;
