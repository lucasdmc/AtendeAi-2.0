const Conversation = require('../models/conversation');
const Message = require('../models/message');
const LLMOrchestrator = require('../services/llmOrchestrator');
const ConversationalMemory = require('../services/conversationalMemory');
const logger = require('../utils/logger');
const config = require('../config');

class ConversationController {
  constructor() {
    this.llmOrchestrator = new LLMOrchestrator();
    this.memory = new ConversationalMemory();
  }

  async processWhatsAppMessage(req, res) {
    try {
      const { 
        clinic_id, 
        patient_phone, 
        patient_name, 
        message_content, 
        message_type = 'text',
        metadata = {}
      } = req.body;

      if (!clinic_id || !patient_phone || !message_content) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, patient_phone, message_content'
        });
      }

      logger.info('Processing WhatsApp message', { 
        clinic_id, 
        patient_phone, 
        message_length: message_content.length 
      });

      let conversation = await Conversation.findByPhone(clinic_id, patient_phone);
      
      if (!conversation) {
        conversation = await Conversation.create({
          clinic_id,
          patient_phone,
          patient_name: patient_name || 'Usuário',
          status: 'active'
        });
        
        logger.info('New conversation created', { 
          conversation_id: conversation.id, 
          clinic_id, 
          patient_phone 
        });
      }

      const message = await Message.create({
        conversation_id: conversation.id,
        clinic_id,
        patient_phone,
        content: message_content,
        type: message_type,
        direction: 'inbound',
        metadata
      });

      await this.memory.addMessageToContext(clinic_id, patient_phone, message);
      await Conversation.updateLastMessage(conversation.id, message_content);

      const clinicContext = await this.getClinicContext(clinic_id);
      const processingResult = await this.llmOrchestrator.processMessage(
        message_content, 
        clinic_id, 
        patient_phone, 
        clinicContext
      );

      let response;
      if (processingResult.type === 'routed') {
        response = await this.handleServiceRouting(processingResult, conversation, message);
      } else if (processingResult.type === 'response') {
        response = await this.handleAIResponse(processingResult, conversation, message);
      } else {
        response = await this.handleError(processingResult, conversation, message);
      }

      await this.memory.updateUserProfile(clinic_id, patient_phone, {
        last_interaction: new Date().toISOString(),
        message_count: (await this.memory.getUserProfile(clinic_id, patient_phone))?.message_count + 1 || 1
      });

      res.json({
        success: true,
        data: {
          conversation_id: conversation.id,
          message_id: message.id,
          response,
          processing_result: processingResult
        }
      });

    } catch (error) {
      logger.error('Error processing WhatsApp message', { 
        error: error.message, 
        stack: error.stack,
        body: req.body 
      });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error processing message',
        details: error.message
      });
    }
  }

  async handleServiceRouting(routingResult, conversation, message) {
    try {
      const responseMessage = await Message.create({
        conversation_id: conversation.id,
        clinic_id: conversation.clinic_id,
        patient_phone: conversation.patient_phone,
        content: `Mensagem encaminhada para ${routingResult.routing.target_service}`,
        type: 'text',
        direction: 'outbound',
        metadata: {
          routed: true,
          target_service: routingResult.routing.target_service,
          intent: routingResult.intent
        }
      });

      await this.memory.addMessageToContext(conversation.clinic_id, conversation.patient_phone, responseMessage);
      await Conversation.updateLastMessage(conversation.id, responseMessage.content);

      return {
        type: 'routed',
        content: responseMessage.content,
        target_service: routingResult.routing.target_service,
        intent: routingResult.intent
      };
    } catch (error) {
      logger.error('Error handling service routing', { error: error.message, routingResult });
      throw error;
    }
  }

  async handleAIResponse(processingResult, conversation, message) {
    try {
      const responseMessage = await Message.create({
        conversation_id: conversation.id,
        clinic_id: conversation.clinic_id,
        patient_phone: conversation.patient_phone,
        content: processingResult.response.content,
        type: 'text',
        direction: 'outbound',
        metadata: {
          ai_generated: true,
          intent: processingResult.intent,
          confidence: processingResult.confidence,
          model: processingResult.response.metadata?.model
        }
      });

      await this.memory.addMessageToContext(conversation.clinic_id, conversation.patient_phone, responseMessage);
      await Conversation.updateLastMessage(conversation.id, responseMessage.content);

      return {
        type: 'ai_response',
        content: responseMessage.content,
        intent: processingResult.intent,
        confidence: processingResult.confidence,
        metadata: processingResult.response.metadata
      };
    } catch (error) {
      logger.error('Error handling AI response', { error: error.message, processingResult });
      throw error;
    }
  }

  async handleError(processingResult, conversation, message) {
    try {
      const fallbackContent = processingResult.fallback_response?.content || 
        'Desculpe, ocorreu um erro no processamento. Por favor, tente novamente ou entre em contato com um atendente humano.';

      const responseMessage = await Message.create({
        conversation_id: conversation.id,
        clinic_id: conversation.clinic_id,
        patient_phone: conversation.patient_phone,
        content: fallbackContent,
        type: 'text',
        direction: 'outbound',
        metadata: {
          error: true,
          error_message: processingResult.error,
          fallback: true
        }
      });

      await this.memory.addMessageToContext(conversation.clinic_id, conversation.patient_phone, responseMessage);
      await Conversation.updateLastMessage(conversation.id, responseMessage.content);

      return {
        type: 'error',
        content: responseMessage.content,
        error: processingResult.error,
        fallback: true
      };
    } catch (error) {
      logger.error('Error handling error response', { error: error.message, processingResult });
      throw error;
    }
  }

  async getConversationHistory(req, res) {
    try {
      const { clinic_id, patient_phone, limit = 50, offset = 0 } = req.query;

      if (!clinic_id || !patient_phone) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, patient_phone'
        });
      }

      const messages = await Message.findByPhone(clinic_id, patient_phone, limit, offset);
      const conversation = await Conversation.findByPhone(clinic_id, patient_phone);
      const memoryStats = await this.memory.getMemoryStats(clinic_id, patient_phone);

      res.json({
        success: true,
        data: {
          conversation,
          messages,
          memory_stats: memoryStats,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: messages.length
          }
        }
      });

    } catch (error) {
      logger.error('Error getting conversation history', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting conversation history',
        details: error.message
      });
    }
  }

  async getConversationsByClinic(req, res) {
    try {
      const { clinic_id, limit = 50, offset = 0, status } = req.params;

      if (!clinic_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: clinic_id'
        });
      }

      let conversations;
      if (status === 'active') {
        conversations = await Conversation.getActiveConversations(clinic_id);
      } else {
        conversations = await Conversation.findByClinic(clinic_id, limit, offset);
      }

      res.json({
        success: true,
        data: {
          conversations,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: conversations.length
          }
        }
      });

    } catch (error) {
      logger.error('Error getting conversations by clinic', { error: error.message, params: req.params });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting conversations',
        details: error.message
      });
    }
  }

  async closeConversation(req, res) {
    try {
      const { conversation_id } = req.params;

      if (!conversation_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: conversation_id'
        });
      }

      const conversation = await Conversation.closeConversation(conversation_id);
      
      if (conversation.patient_phone) {
        await this.memory.clearUserMemory(conversation.clinic_id, conversation.patient_phone);
      }

      res.json({
        success: true,
        data: {
          conversation,
          message: 'Conversation closed successfully'
        }
      });

    } catch (error) {
      logger.error('Error closing conversation', { error: error.message, params: req.params });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error closing conversation',
        details: error.message
      });
    }
  }

  async getMemoryStats(req, res) {
    try {
      const { clinic_id, patient_phone } = req.query;

      if (!clinic_id || !patient_phone) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, patient_phone'
        });
      }

      const stats = await this.memory.getMemoryStats(clinic_id, patient_phone);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Error getting memory stats', { error: error.message, query: req.query });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error getting memory stats',
        details: error.message
      });
    }
  }

  async clearUserMemory(req, res) {
    try {
      const { clinic_id, patient_phone } = req.body;

      if (!clinic_id || !patient_phone) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: clinic_id, patient_phone'
        });
      }

      const success = await this.memory.clearUserMemory(clinic_id, patient_phone);

      res.json({
        success: true,
        data: {
          cleared: success,
          message: success ? 'User memory cleared successfully' : 'Failed to clear user memory'
        }
      });

    } catch (error) {
      logger.error('Error clearing user memory', { error: error.message, body: req.body });
      
      res.status(500).json({
        success: false,
        error: 'Internal server error clearing user memory',
        details: error.message
      });
    }
  }

  async getClinicContext(clinic_id) {
    try {
      const response = await fetch(`${config.clinic.serviceUrl}/api/clinics/${clinic_id}/context`, {
        headers: {
          'Authorization': `Bearer ${config.clinic.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const context = await response.json();
        return context.data;
      }

      logger.warn('Failed to get clinic context', { clinic_id, status: response.status });
      return null;
    } catch (error) {
      logger.error('Error getting clinic context', { error: error.message, clinic_id });
      return null;
    }
  }
}

module.exports = ConversationController;
