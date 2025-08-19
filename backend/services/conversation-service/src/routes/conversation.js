const express = require('express');
const router = express.Router();
const ConversationController = require('../controllers/conversationController');
const { body, query, param, validationResult } = require('express-validator');

const conversationController = new ConversationController();

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

// POST /api/conversation/process
// Processa mensagem do WhatsApp
router.post('/process', [
  body('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  body('patient_phone').isMobilePhone('pt-BR').withMessage('patient_phone deve ser um telefone válido'),
  body('message_content').isLength({ min: 1, max: 1000 }).withMessage('message_content deve ter entre 1 e 1000 caracteres'),
  body('patient_name').optional().isLength({ min: 1, max: 100 }).withMessage('patient_name deve ter entre 1 e 100 caracteres'),
  body('message_type').optional().isIn(['text', 'image', 'audio', 'video', 'document']).withMessage('message_type deve ser um tipo válido'),
  handleValidationErrors
], conversationController.processWhatsAppMessage.bind(conversationController));

// GET /api/conversation/history
// Obtém histórico de conversa
router.get('/history', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('patient_phone').isMobilePhone('pt-BR').withMessage('patient_phone deve ser um telefone válido'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit deve ser um número entre 1 e 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset deve ser um número não negativo'),
  handleValidationErrors
], conversationController.getConversationHistory.bind(conversationController));

// GET /api/conversation/clinic/:clinic_id
// Obtém conversas por clínica
router.get('/clinic/:clinic_id', [
  param('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit deve ser um número entre 1 e 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset deve ser um número não negativo'),
  handleValidationErrors
], conversationController.getConversationsByClinic.bind(conversationController));

// GET /api/conversation/clinic/:clinic_id/active
// Obtém conversas ativas por clínica
router.get('/clinic/:clinic_id/active', [
  param('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  handleValidationErrors
], conversationController.getConversationsByClinic.bind(conversationController));

// PUT /api/conversation/:conversation_id/close
// Fecha uma conversa
router.put('/:conversation_id/close', [
  param('conversation_id').isUUID().withMessage('conversation_id deve ser um UUID válido'),
  handleValidationErrors
], conversationController.closeConversation.bind(conversationController));

// GET /api/conversation/memory/stats
// Obtém estatísticas de memória do usuário
router.get('/memory/stats', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('patient_phone').isMobilePhone('pt-BR').withMessage('patient_phone deve ser um telefone válido'),
  handleValidationErrors
], conversationController.getMemoryStats.bind(conversationController));

// DELETE /api/conversation/memory/clear
// Limpa memória do usuário
router.delete('/memory/clear', [
  body('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  body('patient_phone').isMobilePhone('pt-BR').withMessage('patient_phone deve ser um telefone válido'),
  handleValidationErrors
], conversationController.clearUserMemory.bind(conversationController));

// GET /api/conversation/health
// Health check do serviço
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'conversation-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// GET /api/conversation/status
// Status detalhado do serviço
router.get('/status', async (req, res) => {
  try {
    const status = {
      success: true,
      service: 'conversation-service',
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      components: {
        database: 'connected',
        redis: 'connected',
        openai: 'configured',
        llm_orchestrator: 'active'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'conversation-service',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
