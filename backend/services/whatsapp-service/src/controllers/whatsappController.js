const WhatsAppService = require('../services/whatsappService');
const WebhookValidator = require('../middleware/webhookValidation');
const Joi = require('joi');

class WhatsAppController {
    constructor() {
        this.whatsappService = new WhatsAppService();
        this.webhookValidator = new WebhookValidator(
            process.env.WHATSAPP_VERIFY_TOKEN,
            process.env.WHATSAPP_APP_SECRET
        );
    }

    async handleWebhook(req, res) {
        try {
            const { payload, signature, clinicId } = req.body;
            
            if (!payload || !clinicId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: payload and clinicId'
                });
            }

            const result = await this.whatsappService.processWebhook(payload, signature, clinicId);
            
            res.status(200).json({
                success: true,
                messageId: result.messageId
            });
        } catch (error) {
            console.error('Webhook processing error:', error);
            
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async verifyWebhook(req, res) {
        try {
            const { mode, token, challenge } = req.query;
            
            if (!mode || !token) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: mode and token'
                });
            }

            const result = this.webhookValidator.validateVerification(mode, token, challenge);
            
            if (result) {
                res.status(200).send(result);
            } else {
                res.status(403).json({
                    success: false,
                    error: 'Verification failed'
                });
            }
        } catch (error) {
            console.error('Webhook verification error:', error);
            
            res.status(403).json({
                success: false,
                error: error.message
            });
        }
    }

    async sendMessage(req, res) {
        try {
            const { toPhone, messageType, content, clinicId } = req.body;
            
            const validation = this.validateSendMessageRequest(req.body);
            if (validation.error) {
                return res.status(400).json({
                    success: false,
                    error: validation.error.details[0].message
                });
            }

            const message = {
                toPhone,
                messageType,
                content,
                clinicId
            };

            const result = await this.whatsappService.sendMessage(message);
            
            res.status(200).json({
                success: true,
                messageId: result.id,
                status: 'sent'
            });
        } catch (error) {
            console.error('Send message error:', error);
            
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getMessageStatus(req, res) {
        try {
            const { messageId } = req.params;
            
            if (!messageId) {
                return res.status(400).json({
                    success: false,
                    error: 'Message ID is required'
                });
            }

            const status = await this.whatsappService.metaAPI.getMessageStatus(messageId);
            
            res.status(200).json({
                success: true,
                status
            });
        } catch (error) {
            console.error('Get message status error:', error);
            
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getClinicContext(req, res) {
        try {
            const { clinicId } = req.params;
            
            if (!clinicId) {
                return res.status(400).json({
                    success: false,
                    error: 'Clinic ID is required'
                });
            }

            const context = await this.whatsappService.getClinicContext(clinicId);
            
            if (!context) {
                return res.status(404).json({
                    success: false,
                    error: 'Clinic context not found'
                });
            }

            res.status(200).json({
                success: true,
                context
            });
        } catch (error) {
            console.error('Get clinic context error:', error);
            
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    async getWhatsAppConfig(req, res) {
        try {
            const { clinicId } = req.params;
            
            if (!clinicId) {
                return res.status(400).json({
                    success: false,
                    error: 'Clinic ID is required'
                });
            }

            const config = await this.whatsappService.getWhatsAppConfig(clinicId);
            
            if (!config) {
                return res.status(404).json({
                    success: false,
                    error: 'WhatsApp config not found'
                });
            }

            res.status(200).json({
                success: true,
                config
            });
        } catch (error) {
            console.error('Get WhatsApp config error:', error);
            
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    validateSendMessageRequest(data) {
        const schema = Joi.object({
            toPhone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required(),
            messageType: Joi.string().valid('text', 'image', 'audio', 'video', 'document', 'location').required(),
            content: Joi.any().required(),
            clinicId: Joi.string().uuid().required()
        });

        return schema.validate(data);
    }
}

module.exports = WhatsAppController;
