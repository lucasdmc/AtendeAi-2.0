const WhatsAppService = require('../services/whatsappService');
const Message = require('../models/message');
const logger = require('../utils/logger');

class WhatsAppController {
  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  async sendTextMessage(req, res) {
    try {
      const { patient_phone, message, clinic_id, conversation_id } = req.body;

      if (!patient_phone || !message || !clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: patient_phone, message, clinic_id'
        });
      }

      const result = await this.whatsappService.sendTextMessage(
        patient_phone, 
        message, 
        clinic_id, 
        conversation_id
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error sending text message', { error: error.message, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error sending text message',
        details: error.message
      });
    }
  }

  async sendTemplateMessage(req, res) {
    try {
      const { patient_phone, template_name, language_code, components, clinic_id, conversation_id } = req.body;

      if (!patient_phone || !template_name || !language_code || !clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: patient_phone, template_name, language_code, clinic_id'
        });
      }

      const result = await this.whatsappService.sendTemplateMessage(
        patient_phone,
        template_name,
        language_code,
        components || [],
        clinic_id,
        conversation_id
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error sending template message', { error: error.message, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error sending template message',
        details: error.message
      });
    }
  }

  async sendMediaMessage(req, res) {
    try {
      const { patient_phone, media_type, media_url, caption, clinic_id, conversation_id } = req.body;

      if (!patient_phone || !media_type || !media_url || !clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: patient_phone, media_type, media_url, clinic_id'
        });
      }

      const result = await this.whatsappService.sendMediaMessage(
        patient_phone,
        media_type,
        media_url,
        caption,
        clinic_id,
        conversation_id
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error sending media message', { error: error.message, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error sending media message',
        details: error.message
      });
    }
  }

  async sendInteractiveMessage(req, res) {
    try {
      const { patient_phone, interactive_data, clinic_id, conversation_id } = req.body;

      if (!patient_phone || !interactive_data || !clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: patient_phone, interactive_data, clinic_id'
        });
      }

      const result = await this.whatsappService.sendInteractiveMessage(
        patient_phone,
        interactive_data,
        clinic_id,
        conversation_id
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error sending interactive message', { error: error.message, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error sending interactive message',
        details: error.message
      });
    }
  }

  async handleWebhook(req, res) {
    try {
      const webhookData = req.body;
      
      if (!webhookData || !webhookData.entry) {
        return res.status(400).json({
          success: false,
          error: 'Invalid webhook data'
        });
      }

      const result = await this.whatsappService.processWebhook(webhookData);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error handling webhook', { error: error.message, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error handling webhook',
        details: error.message
      });
    }
  }

  async verifyWebhook(req, res) {
    try {
      const { mode, token, challenge } = req.query;

      if (!mode || !token) {
        return res.status(400).json({
          success: false,
          error: 'Missing required query parameters: mode, token'
        });
      }

      const result = await this.whatsappService.verifyWebhook(mode, token, challenge);

      if (result) {
        res.status(200).send(result);
      } else {
        res.status(403).json({
          success: false,
          error: 'Webhook verification failed'
        });
      }

    } catch (error) {
      logger.error('Error verifying webhook', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error verifying webhook',
        details: error.message
      });
    }
  }

  async getMessageStatus(req, res) {
    try {
      const { message_id } = req.params;

      if (!message_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: message_id'
        });
      }

      const result = await this.whatsappService.getMessageStatus(message_id);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error getting message status', { error: error.message, params: req.params });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting message status',
        details: error.message
      });
    }
  }

  async uploadMedia(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded'
        });
      }

      const { buffer, mimetype, originalname } = req.file;
      const { clinic_id } = req.body;

      if (!clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: clinic_id'
        });
      }

      const result = await this.whatsappService.uploadMedia(buffer, mimetype, originalname);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error uploading media', { error: error.message, file: req.file });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error uploading media',
        details: error.message
      });
    }
  }

  async getMessages(req, res) {
    try {
      const { clinic_id, patient_phone, limit = 50, offset = 0, status } = req.query;

      if (!clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: clinic_id'
        });
      }

      let messages;
      if (patient_phone) {
        messages = await Message.findByPatient(clinic_id, patient_phone, limit, offset);
      } else {
        messages = await Message.findByClinic(clinic_id, limit, offset, status);
      }

      res.json({
        success: true,
        data: {
          messages,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: messages.length
          }
        }
      });

    } catch (error) {
      logger.error('Error getting messages', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting messages',
        details: error.message
      });
    }
  }

  async getMessageById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: id'
        });
      }

      const message = await Message.findById(id);
      if (!message) {
        return res.status(404).json({
          success: false,
          error: 'Message not found'
        });
      }

      res.json({
        success: true,
        data: message
      });

    } catch (error) {
      logger.error('Error getting message by id', { error: error.message, params: req.params });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting message',
        details: error.message
      });
    }
  }

  async updateMessage(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: id'
        });
      }

      const message = await Message.update(id, updateData);

      res.json({
        success: true,
        data: message
      });

    } catch (error) {
      logger.error('Error updating message', { error: error.message, params: req.params, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error updating message',
        details: error.message
      });
    }
  }

  async deleteMessage(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: id'
        });
      }

      const message = await Message.delete(id);

      res.json({
        success: true,
        data: {
          message,
          message: 'Message deleted successfully'
        }
      });

    } catch (error) {
      logger.error('Error deleting message', { error: error.message, params: req.params });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error deleting message',
        details: error.message
      });
    }
  }

  async getMessageStats(req, res) {
    try {
      const { clinic_id, start_date, end_date } = req.query;

      if (!clinic_id || !start_date || !end_date) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, start_date, end_date'
        });
      }

      const stats = await Message.getMessageStats(clinic_id, start_date, end_date);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Error getting message stats', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting message stats',
        details: error.message
      });
    }
  }

  async getRecentMessages(req, res) {
    try {
      const { clinic_id, hours = 24 } = req.query;

      if (!clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: clinic_id'
        });
      }

      const messages = await Message.getRecentMessages(clinic_id, hours);

      res.json({
        success: true,
        data: {
          messages,
          hours: parseInt(hours),
          count: messages.length
        }
      });

    } catch (error) {
      logger.error('Error getting recent messages', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting recent messages',
        details: error.message
      });
    }
  }

  async getUnprocessedMessages(req, res) {
    try {
      const { clinic_id, limit = 100 } = req.query;

      if (!clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: clinic_id'
        });
      }

      const messages = await Message.getUnprocessedMessages(clinic_id, limit);

      res.json({
        success: true,
        data: {
          messages,
          count: messages.length,
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      logger.error('Error getting unprocessed messages', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting unprocessed messages',
        details: error.message
      });
    }
  }

  async markMessageAsProcessed(req, res) {
    try {
      const { id } = req.params;
      const { processing_result } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: id'
        });
      }

      const message = await Message.markAsProcessed(id, processing_result || {});

      res.json({
        success: true,
        data: message
      });

    } catch (error) {
      logger.error('Error marking message as processed', { error: error.message, params: req.params, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error marking message as processed',
        details: error.message
      });
    }
  }

  async testConnection(req, res) {
    try {
      const result = await this.whatsappService.testConnection();

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error testing WhatsApp connection', { error: error.message });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error testing connection',
        details: error.message
      });
    }
  }

  async getAccountInfo(req, res) {
    try {
      const result = await this.whatsappService.getAccountInfo();

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error getting account info', { error: error.message });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting account info',
        details: error.message
      });
    }
  }
}

module.exports = WhatsAppController;
