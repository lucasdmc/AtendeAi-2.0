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

// ===== PROCESSAMENTO DE MENSAGENS =====

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

// ===== TRANSIÇÃO CHATBOT/HUMANO =====

// POST /api/conversation/:conversation_id/transition/human
// Transfere conversa para atendente humano
router.post('/:conversation_id/transition/human', [
  param('conversation_id').isUUID().withMessage('conversation_id deve ser um UUID válido'),
  body('attendant_id').isUUID().withMessage('attendant_id deve ser um UUID válido'),
  body('reason').optional().isLength({ max: 500 }).withMessage('reason deve ter no máximo 500 caracteres'),
  handleValidationErrors
], conversationController.transitionToHuman.bind(conversationController));

// POST /api/conversation/:conversation_id/transition/bot
// Retorna conversa para chatbot
router.post('/:conversation_id/transition/bot', [
  param('conversation_id').isUUID().withMessage('conversation_id deve ser um UUID válido'),
  body('reason').optional().isLength({ max: 500 }).withMessage('reason deve ter no máximo 500 caracteres'),
  handleValidationErrors
], conversationController.transitionToBot.bind(conversationController));

// GET /api/conversation/:conversation_id/transition/history
// Obtém histórico de transições da conversa
router.get('/:conversation_id/transition/history', [
  param('conversation_id').isUUID().withMessage('conversation_id deve ser um UUID válido'),
  handleValidationErrors
], conversationController.getTransitionHistory.bind(conversationController));

// ===== GESTÃO DE CONVERSAS =====

// GET /api/conversation/history
// Obtém histórico de conversa
router.get('/history', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('patient_phone').isMobilePhone('pt-BR').withMessage('patient_phone deve ser um UUID válido'),
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
], conversationController.getActiveConversationsByClinic.bind(conversationController));

// GET /api/conversation/clinic/:clinic_id/pending
// Obtém conversas pendentes de atendimento humano
router.get('/clinic/:clinic_id/pending', [
  param('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  handleValidationErrors
], conversationController.getPendingHumanConversations.bind(conversationController));

// GET /api/conversation/:conversation_id
// Obtém conversa específica
router.get('/:conversation_id', [
  param('conversation_id').isUUID().withMessage('conversation_id deve ser um UUID válido'),
  handleValidationErrors
], conversationController.getConversationById.bind(conversationController));

// PUT /api/conversation/:conversation_id/close
// Fecha uma conversa
router.put('/:conversation_id/close', [
  param('conversation_id').isUUID().withMessage('conversation_id deve ser um UUID válido'),
  body('reason').optional().isLength({ max: 500 }).withMessage('reason deve ter no máximo 500 caracteres'),
  handleValidationErrors
], conversationController.closeConversation.bind(conversationController));

// PUT /api/conversation/:conversation_id/assign
// Atribui conversa para atendente
router.put('/:conversation_id/assign', [
  param('conversation_id').isUUID().withMessage('conversation_id deve ser um UUID válido'),
  body('attendant_id').isUUID().withMessage('attendant_id deve ser um UUID válido'),
  handleValidationErrors
], conversationController.assignConversation.bind(conversationController));

// PUT /api/conversation/:conversation_id/priority
// Define prioridade da conversa
router.put('/:conversation_id/priority', [
  param('conversation_id').isUUID().withMessage('conversation_id deve ser um UUID válido'),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('priority deve ser uma prioridade válida'),
  handleValidationErrors
], conversationController.setConversationPriority.bind(conversationController));

// ===== GESTÃO DE MEMÓRIA =====

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

// GET /api/conversation/memory/:conversation_id
// Obtém memória de uma conversa específica
router.get('/memory/:conversation_id', [
  param('conversation_id').isUUID().withMessage('conversation_id deve ser um UUID válido'),
  handleValidationErrors
], conversationController.getConversationMemory.bind(conversationController));

// ===== ANÁLISE E ESTATÍSTICAS =====

// GET /api/conversation/analytics/clinic/:clinic_id
// Obtém análises de conversas por clínica
router.get('/analytics/clinic/:clinic_id', [
  param('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('start_date').optional().isISO8601().withMessage('start_date deve ser uma data válida no formato ISO'),
  query('end_date').optional().isISO8601().withMessage('end_date deve ser uma data válida no formato ISO'),
  handleValidationErrors
], conversationController.getConversationAnalytics.bind(conversationController));

// GET /api/conversation/analytics/attendant/:attendant_id
// Obtém análises de conversas por atendente
router.get('/analytics/attendant/:attendant_id', [
  param('attendant_id').isUUID().withMessage('attendant_id deve ser um UUID válido'),
  query('start_date').optional().isISO8601().withMessage('start_date deve ser uma data válida no formato ISO'),
  query('end_date').optional().isISO8601().withMessage('end_date deve ser uma data válida no formato ISO'),
  handleValidationErrors
], conversationController.getAttendantAnalytics.bind(conversationController));

// ===== HEALTH CHECK E STATUS =====

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
        llm_orchestrator: 'active',
        conversational_memory: 'active',
        transition_manager: 'active'
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
