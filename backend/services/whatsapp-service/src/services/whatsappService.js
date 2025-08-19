const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');
const config = require('../config');
const logger = require('../utils/logger');
const Message = require('../models/message');
const redis = require('../config/redis');

class WhatsAppService {
  constructor() {
    this.baseUrl = config.whatsapp.baseUrl;
    this.apiVersion = config.whatsapp.apiVersion;
    this.phoneNumberId = config.whatsapp.phoneNumberId;
    this.accessToken = config.whatsapp.accessToken;
    this.businessAccountId = config.whatsapp.businessAccountId;
    this.webhookVerifyToken = config.whatsapp.webhookVerifyToken;
    this.maxRetries = config.whatsapp.maxRetries;
    this.retryDelay = config.whatsapp.retryDelay;
  }

  async sendTextMessage(patient_phone, message, clinic_id, conversation_id = null) {
    try {
      const messageData = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: patient_phone,
        type: 'text',
        text: {
          preview_url: false,
          body: message
        }
      };

      const response = await this.makeWhatsAppRequest('POST', `/messages`, messageData);
      
      if (response.data && response.data.messages && response.data.messages[0]) {
        const whatsappMessageId = response.data.messages[0].id;
        
        const savedMessage = await Message.create({
          clinic_id,
          patient_phone,
          patient_name: 'Unknown',
          message_type: 'text',
          content: message,
          direction: 'outbound',
          whatsapp_message_id: whatsappMessageId,
          conversation_id,
          status: 'sent',
          metadata: {
            whatsapp_response: response.data,
            message_category: response.data.messages[0].message_status
          }
        });

        logger.info('Text message sent successfully', {
          patient_phone,
          clinic_id,
          whatsapp_message_id: whatsappMessageId,
          message_id: savedMessage.id
        });

        return {
          success: true,
          message_id: savedMessage.id,
          whatsapp_message_id: whatsappMessageId,
          status: 'sent'
        };
      }

      throw new Error('Invalid response from WhatsApp API');
    } catch (error) {
      logger.error('Error sending text message', {
        error: error.message,
        patient_phone,
        clinic_id,
        message
      });
      throw error;
    }
  }

  async sendTemplateMessage(patient_phone, template_name, language_code, components = [], clinic_id, conversation_id = null) {
    try {
      const messageData = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: patient_phone,
        type: 'template',
        template: {
          name: template_name,
          language: {
            code: language_code
          }
        }
      };

      if (components && components.length > 0) {
        messageData.template.components = components;
      }

      const response = await this.makeWhatsAppRequest('POST', `/messages`, messageData);
      
      if (response.data && response.data.messages && response.data.messages[0]) {
        const whatsappMessageId = response.data.messages[0].id;
        
        const savedMessage = await Message.create({
          clinic_id,
          patient_phone,
          patient_name: 'Unknown',
          message_type: 'template',
          content: JSON.stringify(messageData.template),
          direction: 'outbound',
          whatsapp_message_id: whatsappMessageId,
          conversation_id,
          status: 'sent',
          metadata: {
            whatsapp_response: response.data,
            template_name,
            language_code,
            components
          }
        });

        logger.info('Template message sent successfully', {
          patient_phone,
          clinic_id,
          template_name,
          whatsapp_message_id: whatsappMessageId,
          message_id: savedMessage.id
        });

        return {
          success: true,
          message_id: savedMessage.id,
          whatsapp_message_id: whatsappMessageId,
          status: 'sent'
        };
      }

      throw new Error('Invalid response from WhatsApp API');
    } catch (error) {
      logger.error('Error sending template message', {
        error: error.message,
        patient_phone,
        clinic_id,
        template_name
      });
      throw error;
    }
  }

  async sendMediaMessage(patient_phone, media_type, media_url, caption = null, clinic_id, conversation_id = null) {
    try {
      let messageData = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: patient_phone,
        type: media_type
      };

      if (media_type === 'image') {
        messageData.image = {
          link: media_url
        };
        if (caption) {
          messageData.image.caption = caption;
        }
      } else if (media_type === 'audio') {
        messageData.audio = {
          link: media_url
        };
      } else if (media_type === 'video') {
        messageData.video = {
          link: media_url
        };
        if (caption) {
          messageData.video.caption = caption;
        }
      } else if (media_type === 'document') {
        messageData.document = {
          link: media_url
        };
        if (caption) {
          messageData.document.caption = caption;
        }
      }

      const response = await this.makeWhatsAppRequest('POST', `/messages`, messageData);
      
      if (response.data && response.data.messages && response.data.messages[0]) {
        const whatsappMessageId = response.data.messages[0].id;
        
        const savedMessage = await Message.create({
          clinic_id,
          patient_phone,
          patient_name: 'Unknown',
          message_type: media_type,
          content: media_url,
          direction: 'outbound',
          whatsapp_message_id: whatsappMessageId,
          conversation_id,
          status: 'sent',
          metadata: {
            whatsapp_response: response.data,
            media_type,
            caption,
            media_url
          }
        });

        logger.info('Media message sent successfully', {
          patient_phone,
          clinic_id,
          media_type,
          whatsapp_message_id: whatsappMessageId,
          message_id: savedMessage.id
        });

        return {
          success: true,
          message_id: savedMessage.id,
          whatsapp_message_id: whatsappMessageId,
          status: 'sent'
        };
      }

      throw new Error('Invalid response from WhatsApp API');
    } catch (error) {
      logger.error('Error sending media message', {
        error: error.message,
        patient_phone,
        clinic_id,
        media_type,
        media_url
      });
      throw error;
    }
  }

  async sendInteractiveMessage(patient_phone, interactive_data, clinic_id, conversation_id = null) {
    try {
      const messageData = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: patient_phone,
        type: 'interactive',
        interactive: interactive_data
      };

      const response = await this.makeWhatsAppRequest('POST', `/messages`, messageData);
      
      if (response.data && response.data.messages && response.data.messages[0]) {
        const whatsappMessageId = response.data.messages[0].id;
        
        const savedMessage = await Message.create({
          clinic_id,
          patient_phone,
          patient_name: 'Unknown',
          message_type: 'interactive',
          content: JSON.stringify(interactive_data),
          direction: 'outbound',
          whatsapp_message_id: whatsappMessageId,
          conversation_id,
          status: 'sent',
          metadata: {
            whatsapp_response: response.data,
            interactive_type: interactive_data.type
          }
        });

        logger.info('Interactive message sent successfully', {
          patient_phone,
          clinic_id,
          interactive_type: interactive_data.type,
          whatsapp_message_id: whatsappMessageId,
          message_id: savedMessage.id
        });

        return {
          success: true,
          message_id: savedMessage.id,
          whatsapp_message_id: whatsappMessageId,
          status: 'sent'
        };
      }

      throw new Error('Invalid response from WhatsApp API');
    } catch (error) {
      logger.error('Error sending interactive message', {
        error: error.message,
        patient_phone,
        clinic_id,
        interactive_data
      });
      throw error;
    }
  }

  async processWebhook(webhookData) {
    try {
      if (webhookData.entry && webhookData.entry.length > 0) {
        const entry = webhookData.entry[0];
        
        if (entry.changes && entry.changes.length > 0) {
          const change = entry.changes[0];
          
          if (change.value && change.value.messages && change.value.messages.length > 0) {
            const message = change.value.messages[0];
            
            const messageData = {
              clinic_id: await this.getClinicIdFromPhone(message.from),
              patient_phone: message.from,
              patient_name: message.from,
              message_type: message.type,
              content: this.extractMessageContent(message),
              direction: 'inbound',
              whatsapp_message_id: message.id,
              conversation_id: null,
              status: 'received',
              metadata: {
                webhook_data: webhookData,
                message_timestamp: message.timestamp,
                message_type: message.type
              }
            };

            const savedMessage = await Message.create(messageData);
            
            logger.info('Webhook message processed successfully', {
              message_id: savedMessage.id,
              patient_phone: message.from,
              message_type: message.type
            });

            return {
              success: true,
              message_id: savedMessage.id,
              message: savedMessage
            };
          }
        }
      }

      logger.info('Webhook processed but no messages found', { webhookData });
      return { success: true, message: 'No messages in webhook' };
    } catch (error) {
      logger.error('Error processing webhook', { error: error.message, webhookData });
      throw error;
    }
  }

  async verifyWebhook(mode, token, challenge) {
    try {
      if (mode === 'subscribe' && token === this.webhookVerifyToken) {
        logger.info('Webhook verification successful', { mode, token });
        return challenge;
      }
      
      logger.warn('Webhook verification failed', { mode, token });
      return null;
    } catch (error) {
      logger.error('Error verifying webhook', { error: error.message, mode, token });
      throw error;
    }
  }

  async verifyWebhookSignature(payload, signature) {
    try {
      if (!config.security.webhookSignatureSecret) {
        logger.warn('Webhook signature secret not configured, skipping verification');
        return true;
      }

      const expectedSignature = crypto
        .createHmac('sha256', config.security.webhookSignatureSecret)
        .update(payload)
        .digest('hex');

      const isValid = `sha256=${expectedSignature}` === signature;
      
      if (!isValid) {
        logger.warn('Webhook signature verification failed', {
          expected: `sha256=${expectedSignature}`,
          received: signature
        });
      }

      return isValid;
    } catch (error) {
      logger.error('Error verifying webhook signature', { error: error.message });
      return false;
    }
  }

  async getMessageStatus(messageId) {
    try {
      const response = await this.makeWhatsAppRequest('GET', `/messages/${messageId}`);
      
      if (response.data && response.data.statuses && response.data.statuses[0]) {
        const status = response.data.statuses[0];
        
        await Message.updateStatus(messageId, status.status, {
          whatsapp_status: status,
          timestamp: status.timestamp
        });

        logger.info('Message status retrieved successfully', {
          message_id: messageId,
          status: status.status
        });

        return status;
      }

      throw new Error('Invalid response from WhatsApp API');
    } catch (error) {
      logger.error('Error getting message status', { error: error.message, messageId });
      throw error;
    }
  }

  async uploadMedia(fileBuffer, mimeType, fileName) {
    try {
      const formData = new FormData();
      formData.append('messaging_product', 'whatsapp');
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: mimeType
      });

      const response = await this.makeWhatsAppRequest('POST', '/media', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      if (response.data && response.data.id) {
        logger.info('Media uploaded successfully', {
          media_id: response.data.id,
          file_name: fileName,
          mime_type: mimeType
        });

        return {
          success: true,
          media_id: response.data.id,
          url: response.data.url
        };
      }

      throw new Error('Invalid response from WhatsApp API');
    } catch (error) {
      logger.error('Error uploading media', { error: error.message, fileName, mimeType });
      throw error;
    }
  }

  async makeWhatsAppRequest(method, endpoint, data = null, additionalHeaders = {}) {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...additionalHeaders
    };

    let attempts = 0;
    while (attempts < this.maxRetries) {
      try {
        const config = {
          method,
          url,
          headers,
          timeout: 30000
        };

        if (data) {
          if (data instanceof FormData) {
            config.data = data;
            delete config.headers['Content-Type'];
          } else {
            config.data = data;
          }
        }

        const response = await axios(config);
        return response;
      } catch (error) {
        attempts++;
        
        if (attempts >= this.maxRetries) {
          logger.error('Max retries reached for WhatsApp request', {
            method,
            endpoint,
            attempts,
            error: error.message
          });
          throw error;
        }

        if (error.response && error.response.status >= 500) {
          logger.warn(`Retrying WhatsApp request (${attempts}/${this.maxRetries})`, {
            method,
            endpoint,
            status: error.response.status
          });
          
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempts));
        } else {
          throw error;
        }
      }
    }
  }

  extractMessageContent(message) {
    switch (message.type) {
      case 'text':
        return message.text.body;
      case 'image':
        return `[Image: ${message.image.caption || 'No caption'}]`;
      case 'audio':
        return '[Audio message]';
      case 'video':
        return `[Video: ${message.video.caption || 'No caption'}]`;
      case 'document':
        return `[Document: ${message.document.filename || 'Unknown file'}]`;
      case 'location':
        return `[Location: ${message.location.latitude}, ${message.location.longitude}]`;
      case 'contacts':
        return `[Contact: ${message.contacts[0]?.name?.formatted_name || 'Unknown'}]`;
      case 'sticker':
        return '[Sticker]';
      case 'reaction':
        return `[Reaction: ${message.reaction.emoji}]`;
      default:
        return `[${message.type} message]`;
    }
  }

  async getClinicIdFromPhone(phoneNumber) {
    try {
      const cacheKey = `clinic:phone:${phoneNumber}`;
      let clinicId = await redis.get(cacheKey);
      
      if (!clinicId) {
        // Implementar lógica para buscar clínica baseada no número de telefone
        // Por enquanto, retornar um ID padrão
        clinicId = '550e8400-e29b-41d4-a716-446655440000';
        
        // Cache por 1 hora
        await redis.set(cacheKey, clinicId, 3600);
      }
      
      return clinicId;
    } catch (error) {
      logger.error('Error getting clinic ID from phone', { error: error.message, phoneNumber });
      return '550e8400-e29b-41d4-a716-446655440000';
    }
  }

  async getAccountInfo() {
    try {
      const response = await this.makeWhatsAppRequest('GET', '');
      
      if (response.data) {
        logger.info('WhatsApp account info retrieved', { account_info: response.data });
        return response.data;
      }

      throw new Error('Invalid response from WhatsApp API');
    } catch (error) {
      logger.error('Error getting account info', { error: error.message });
      throw error;
    }
  }

  async testConnection() {
    try {
      const accountInfo = await this.getAccountInfo();
      
      logger.info('WhatsApp connection test successful', { account_info: accountInfo });
      
      return {
        connected: true,
        account_info: accountInfo,
        phone_number_id: this.phoneNumberId,
        business_account_id: this.businessAccountId
      };
    } catch (error) {
      logger.error('WhatsApp connection test failed', { error: error.message });
      
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

module.exports = WhatsAppService;
