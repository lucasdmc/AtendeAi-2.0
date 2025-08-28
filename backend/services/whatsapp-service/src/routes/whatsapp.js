const express = require('express');
const WhatsAppController = require('../controllers/whatsappController');

const router = express.Router();
const whatsappController = new WhatsAppController();

// Webhook para receber mensagens da Meta
router.post('/webhook/whatsapp', whatsappController.handleWebhook.bind(whatsappController));

// Verificação do webhook (GET para Meta)
router.get('/webhook/whatsapp', whatsappController.verifyWebhook.bind(whatsappController));

// Enviar mensagem via WhatsApp
router.post('/api/whatsapp/send', whatsappController.sendMessage.bind(whatsappController));

// Obter status de uma mensagem
router.get('/api/whatsapp/message/:messageId/status', whatsappController.getMessageStatus.bind(whatsappController));

// Obter contexto da clínica
router.get('/api/whatsapp/clinic/:clinicId/context', whatsappController.getClinicContext.bind(whatsappController));

// Obter configurações do WhatsApp da clínica
router.get('/api/whatsapp/clinic/:clinicId/config', whatsappController.getWhatsAppConfig.bind(whatsappController));

module.exports = router;
