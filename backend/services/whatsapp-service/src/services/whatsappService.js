const MetaWhatsAppAPI = require('./metaWhatsAppAPI');
const WhatsAppMessageAdapter = require('../utils/whatsappMessageAdapter');
const MetaAPICircuitBreaker = require('../utils/circuitBreaker');
const RetryStrategy = require('../utils/retryStrategy');
const FallbackStrategy = require('../utils/fallbackStrategy');
const ConversationServiceClient = require('../clients/conversationServiceClient');
const ClinicServiceClient = require('../clients/clinicServiceClient');

class WhatsAppService {
    constructor() {
        this.metaAPI = new MetaWhatsAppAPI();
        this.messageAdapter = new WhatsAppMessageAdapter();
        this.circuitBreaker = new MetaAPICircuitBreaker();
        this.retryStrategy = new RetryStrategy();
        this.fallbackStrategy = null;
        this.conversationService = new ConversationServiceClient();
        this.clinicService = new ClinicServiceClient();
    }

    async processWebhook(payload, signature, clinicId) {
        try {
            this.fallbackStrategy = new FallbackStrategy(clinicId);
            
            const adaptedMessage = this.messageAdapter.adaptIncomingMessage(payload);
            adaptedMessage.clinicId = clinicId;
            
            const aiResponse = await this.processWithAI(adaptedMessage);
            await this.sendMessage(aiResponse);
            await this.persistMessage(adaptedMessage, aiResponse);
            
            return { success: true, messageId: adaptedMessage.id };
        } catch (error) {
            await this.handleError(error, payload, clinicId);
            throw error;
        }
    }

    async sendMessage(message) {
        const adaptedMessage = this.messageAdapter.adaptOutgoingMessage(message);
        
        return await this.circuitBreaker.execute(async () => {
            return await this.retryStrategy.execute(
                () => this.metaAPI.sendMessage(adaptedMessage),
                { operation: 'send_message' }
            );
        });
    }

    async processWithAI(message) {
        return await this.retryStrategy.execute(
            async () => {
                const response = await this.conversationService.processMessage({
                    clinicId: message.clinicId,
                    message: message.content,
                    customerPhone: message.fromPhone,
                    messageType: message.messageType,
                    context: message.context
                });
                
                return {
                    toPhone: message.fromPhone,
                    messageType: 'text',
                    content: response.text,
                    metadata: response.metadata
                };
            },
            { operation: 'ai_processing' }
        );
    }

    async persistMessage(message, response) {
        try {
            const db = require('../config/database');
            
            const messageData = {
                clinic_id: message.clinicId,
                whatsapp_message_id: message.id,
                from_phone_number: message.fromPhone,
                to_phone_number: message.toPhone,
                message_type: message.messageType,
                content_text: message.content?.body || JSON.stringify(message.content),
                content_metadata: message.content,
                status: 'processed',
                timestamp: message.timestamp
            };

            const result = await db.query(
                `INSERT INTO whatsapp.messages (
                    clinic_id, whatsapp_message_id, from_phone_number, to_phone_number,
                    message_type, content_text, content_metadata, status, timestamp
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
                [
                    messageData.clinic_id, messageData.whatsapp_message_id,
                    messageData.from_phone_number, messageData.to_phone_number,
                    messageData.message_type, messageData.content_text,
                    messageData.content_metadata, messageData.status,
                    messageData.timestamp
                ]
            );

            return result.rows[0];
        } catch (error) {
            console.error('Failed to persist message:', error);
            throw new Error(`Database persistence failed: ${error.message}`);
        }
    }

    async handleError(error, payload, clinicId) {
        try {
            const db = require('../config/database');
            
            await db.query(
                `INSERT INTO whatsapp.message_processing_logs (
                    message_id, clinic_id, processing_step, status, error_message, processor_service
                ) VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id || 'unknown',
                    clinicId,
                    'error_handled',
                    'failed',
                    error.message,
                    'WhatsAppService'
                ]
            );
        } catch (dbError) {
            console.error('Failed to log error:', dbError);
        }
    }

    async getClinicContext(clinicId) {
        try {
            return await this.clinicService.getClinicContext(clinicId);
        } catch (error) {
            console.error('Failed to get clinic context:', error);
            return null;
        }
    }

    async getWhatsAppConfig(clinicId) {
        try {
            return await this.clinicService.getWhatsAppConfig(clinicId);
        } catch (error) {
            console.error('Failed to get WhatsApp config:', error);
            return null;
        }
    }
}

module.exports = WhatsAppService;
