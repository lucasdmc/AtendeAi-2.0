const express = require('express');
const router = express.Router();
const multer = require('multer');
const WhatsAppController = require('../controllers/whatsappController');
const { body, query, param, validationResult } = require('express-validator');

const whatsappController = new WhatsAppController();

// Configuração do multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024 // 16MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif',
      'audio/mpeg', 'audio/ogg', 'audio/wav',
      'video/mp4', 'video/avi', 'video/mov',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'), false);
    }
  }
});

// Middleware para validar resultados da validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation errors',
      details: errors.array()
    });
  }
  next();
};

// ===== ENVIO DE MENSAGENS =====

// POST /api/whatsapp/send/text
// Envia mensagem de texto
router.post('/send/text', [
  body('patient_phone').isMobilePhone('pt-BR').withMessage('patient_phone deve ser um telefone válido'),
  body('message').isLength({ min: 1, max: 4096 }).withMessage('message deve ter entre 1 e 4096 caracteres'),
  body('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  body('conversation_id').optional().isUUID().withMessage('conversation_id deve ser um UUID válido'),
  handleValidationErrors
], whatsappController.sendTextMessage.bind(whatsappController));

// POST /api/whatsapp/send/template
// Envia mensagem de template
router.post('/send/template', [
  body('patient_phone').isMobilePhone('pt-BR').withMessage('patient_phone deve ser um telefone válido'),
  body('template_name').isLength({ min: 1, max: 100 }).withMessage('template_name deve ter entre 1 e 100 caracteres'),
  body('language_code').isLength({ min: 2, max: 10 }).withMessage('language_code deve ter entre 2 e 10 caracteres'),
  body('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  body('conversation_id').optional().isUUID().withMessage('conversation_id deve ser um UUID válido'),
  body('components').optional().isArray().withMessage('components deve ser um array'),
  handleValidationErrors
], whatsappController.sendTemplateMessage.bind(whatsappController));

// POST /api/whatsapp/send/media
// Envia mensagem de mídia
router.post('/send/media', [
  body('patient_phone').isMobilePhone('pt-BR').withMessage('patient_phone deve ser um telefone válido'),
  body('media_type').isIn(['image', 'audio', 'video', 'document']).withMessage('media_type deve ser um tipo válido'),
  body('media_url').isURL().withMessage('media_url deve ser uma URL válida'),
  body('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  body('conversation_id').optional().isUUID().withMessage('conversation_id deve ser um UUID válido'),
  body('caption').optional().isLength({ max: 1024 }).withMessage('caption deve ter no máximo 1024 caracteres'),
  handleValidationErrors
], whatsappController.sendMediaMessage.bind(whatsappController));

// POST /api/whatsapp/send/interactive
// Envia mensagem interativa
router.post('/send/interactive', [
  body('patient_phone').isMobilePhone('pt-BR').withMessage('patient_phone deve ser um telefone válido'),
  body('interactive_data').isObject().withMessage('interactive_data deve ser um objeto válido'),
  body('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  body('conversation_id').optional().isUUID().withMessage('conversation_id deve ser um UUID válido'),
  handleValidationErrors
], whatsappController.sendInteractiveMessage.bind(whatsappController));

// ===== WEBHOOK =====

// GET /api/whatsapp/webhook
// Verificação do webhook do WhatsApp
router.get('/webhook', [
  query('mode').isIn(['subscribe', 'unsubscribe']).withMessage('mode deve ser subscribe ou unsubscribe'),
  query('token').isLength({ min: 1 }).withMessage('token é obrigatório'),
  query('challenge').optional().isLength({ min: 1 }).withMessage('challenge deve ter pelo menos 1 caractere'),
  handleValidationErrors
], whatsappController.verifyWebhook.bind(whatsappController));

// POST /api/whatsapp/webhook
// Recebe webhooks do WhatsApp
router.post('/webhook', whatsappController.handleWebhook.bind(whatsappController));

// ===== UPLOAD DE MÍDIA =====

// POST /api/whatsapp/media/upload
// Faz upload de mídia para o WhatsApp
router.post('/media/upload', [
  upload.single('file'),
  body('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  handleValidationErrors
], whatsappController.uploadMedia.bind(whatsappController));

// ===== GESTÃO DE MENSAGENS =====

// GET /api/whatsapp/messages
// Lista mensagens
router.get('/messages', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('patient_phone').optional().isMobilePhone('pt-BR').withMessage('patient_phone deve ser um telefone válido'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit deve ser um número entre 1 e 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset deve ser um número não negativo'),
  query('status').optional().isIn(['received', 'sent', 'delivered', 'read', 'failed', 'processed']).withMessage('status deve ser um status válido'),
  handleValidationErrors
], whatsappController.getMessages.bind(whatsappController));

// GET /api/whatsapp/messages/:id
// Obtém mensagem por ID
router.get('/messages/:id', [
  param('id').isUUID().withMessage('id deve ser um UUID válido'),
  handleValidationErrors
], whatsappController.getMessageById.bind(whatsappController));

// PUT /api/whatsapp/messages/:id
// Atualiza mensagem
router.put('/messages/:id', [
  param('id').isUUID().withMessage('id deve ser um UUID válido'),
  body('content').optional().isLength({ max: 4096 }).withMessage('content deve ter no máximo 4096 caracteres'),
  body('status').optional().isIn(['received', 'sent', 'delivered', 'read', 'failed', 'processed']).withMessage('status deve ser um status válido'),
  handleValidationErrors
], whatsappController.updateMessage.bind(whatsappController));

// DELETE /api/whatsapp/messages/:id
// Remove mensagem
router.delete('/messages/:id', [
  param('id').isUUID().withMessage('id deve ser um UUID válido'),
  handleValidationErrors
], whatsappController.deleteMessage.bind(whatsappController));

// ===== STATUS E ESTATÍSTICAS =====

// GET /api/whatsapp/messages/:message_id/status
// Obtém status de uma mensagem
router.get('/messages/:message_id/status', [
  param('message_id').isUUID().withMessage('message_id deve ser um UUID válido'),
  handleValidationErrors
], whatsappController.getMessageStatus.bind(whatsappController));

// GET /api/whatsapp/messages/stats
// Obtém estatísticas de mensagens
router.get('/messages/stats', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('start_date').isISO8601().withMessage('start_date deve ser uma data válida no formato ISO'),
  query('end_date').isISO8601().withMessage('end_date deve ser uma data válida no formato ISO'),
  handleValidationErrors
], whatsappController.getMessageStats.bind(whatsappController));

// GET /api/whatsapp/messages/recent
// Obtém mensagens recentes
router.get('/messages/recent', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('hours').optional().isInt({ min: 1, max: 168 }).withMessage('hours deve ser um número entre 1 e 168'),
  handleValidationErrors
], whatsappController.getRecentMessages.bind(whatsappController));

// GET /api/whatsapp/messages/unprocessed
// Obtém mensagens não processadas
router.get('/messages/unprocessed', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('limit deve ser um número entre 1 e 1000'),
  handleValidationErrors
], whatsappController.getUnprocessedMessages.bind(whatsappController));

// PUT /api/whatsapp/messages/:id/processed
// Marca mensagem como processada
router.put('/messages/:id/processed', [
  param('id').isUUID().withMessage('id deve ser um UUID válido'),
  body('processing_result').optional().isObject().withMessage('processing_result deve ser um objeto válido'),
  handleValidationErrors
], whatsappController.markMessageAsProcessed.bind(whatsappController));

// ===== CONEXÃO E CONTA =====

// GET /api/whatsapp/connection/test
// Testa conexão com WhatsApp
router.get('/connection/test', whatsappController.testConnection.bind(whatsappController));

// GET /api/whatsapp/account/info
// Obtém informações da conta
router.get('/account/info', whatsappController.getAccountInfo.bind(whatsappController));

// ===== HEALTH CHECK E STATUS =====

// GET /api/whatsapp/health
// Health check do serviço
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'whatsapp-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// GET /api/whatsapp/status
// Status detalhado do serviço
router.get('/status', async (req, res) => {
  try {
    const status = {
      success: true,
      service: 'whatsapp-service',
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      components: {
        database: 'connected',
        redis: 'connected',
        whatsapp_api: 'configured',
        webhook: 'active'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'whatsapp-service',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
