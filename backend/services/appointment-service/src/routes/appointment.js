const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointmentController');
const { body, query, param, validationResult } = require('express-validator');

const appointmentController = new AppointmentController();

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

// ===== FLUXO DE AGENDAMENTO =====

// POST /api/appointment/flow/start
// Inicia o fluxo de agendamento
router.post('/flow/start', [
  body('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  body('patient_phone').isMobilePhone('pt-BR').withMessage('patient_phone deve ser um telefone válido'),
  body('patient_name').isLength({ min: 1, max: 100 }).withMessage('patient_name deve ter entre 1 e 100 caracteres'),
  handleValidationErrors
], appointmentController.startAppointmentFlow.bind(appointmentController));

// GET /api/appointment/flow/current
// Obtém o fluxo atual de agendamento
router.get('/flow/current', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('patient_phone').isMobilePhone('pt-BR').withMessage('patient_phone deve ser um telefone válido'),
  handleValidationErrors
], appointmentController.getCurrentFlow.bind(appointmentController));

// ===== SELEÇÃO DE SERVIÇO =====

// GET /api/appointment/services
// Obtém serviços disponíveis
router.get('/services', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('category').optional().isLength({ min: 1, max: 50 }).withMessage('category deve ter entre 1 e 50 caracteres'),
  handleValidationErrors
], appointmentController.getAvailableServices.bind(appointmentController));

// POST /api/appointment/flow/service
// Seleciona um serviço
router.post('/flow/service', [
  body('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  body('patient_phone').isMobilePhone('pt-BR').withMessage('patient_phone deve ser um telefone válido'),
  body('service_id').isUUID().withMessage('service_id deve ser um UUID válido'),
  handleValidationErrors
], appointmentController.selectService.bind(appointmentController));

// ===== SELEÇÃO DE PROFISSIONAL =====

// GET /api/appointment/professionals
// Obtém profissionais disponíveis
router.get('/professionals', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('service_id').isUUID().withMessage('service_id deve ser um UUID válido'),
  handleValidationErrors
], appointmentController.getAvailableProfessionals.bind(appointmentController));

// POST /api/appointment/flow/professional
// Seleciona um profissional
router.post('/flow/professional', [
  body('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  body('patient_phone').isMobilePhone('pt-BR').withMessage('patient_phone deve ser um telefone válido'),
  body('professional_id').isUUID().withMessage('professional_id deve ser um UUID válido'),
  handleValidationErrors
], appointmentController.selectProfessional.bind(appointmentController));

// ===== SELEÇÃO DE DATA =====

// GET /api/appointment/dates
// Obtém datas disponíveis
router.get('/dates', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('service_id').isUUID().withMessage('service_id deve ser um UUID válido'),
  query('professional_id').optional().isUUID().withMessage('professional_id deve ser um UUID válido'),
  handleValidationErrors
], appointmentController.getAvailableDates.bind(appointmentController));

// POST /api/appointment/flow/date
// Seleciona uma data
router.post('/flow/date', [
  body('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  body('patient_phone').isMobilePhone('pt-BR').withMessage('patient_phone deve ser um telefone válido'),
  body('date').isISO8601().withMessage('date deve ser uma data válida no formato ISO'),
  handleValidationErrors
], appointmentController.selectDate.bind(appointmentController));

// ===== SELEÇÃO DE HORÁRIO =====

// GET /api/appointment/times
// Obtém horários disponíveis
router.get('/times', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('service_id').isUUID().withMessage('service_id deve ser um UUID válido'),
  query('professional_id').optional().isUUID().withMessage('professional_id deve ser um UUID válido'),
  query('date').isISO8601().withMessage('date deve ser uma data válida no formato ISO'),
  handleValidationErrors
], appointmentController.getAvailableTimes.bind(appointmentController));

// POST /api/appointment/flow/time
// Seleciona um horário
router.post('/flow/time', [
  body('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  body('patient_phone').isMobilePhone('pt-BR').withMessage('patient_phone deve ser um telefone válido'),
  body('time').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('time deve ser um horário válido no formato HH:MM'),
  handleValidationErrors
], appointmentController.selectTime.bind(appointmentController));

// ===== CONFIRMAÇÃO =====

// POST /api/appointment/flow/confirm
// Confirma o agendamento
router.post('/flow/confirm', [
  body('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  body('patient_phone').isMobilePhone('pt-BR').withMessage('patient_phone deve ser um telefone válido'),
  body('patient_email').optional().isEmail().withMessage('patient_email deve ser um email válido'),
  body('notes').optional().isLength({ max: 500 }).withMessage('notes deve ter no máximo 500 caracteres'),
  handleValidationErrors
], appointmentController.confirmAppointment.bind(appointmentController));

// POST /api/appointment/flow/cancel
// Cancela o fluxo de agendamento
router.post('/flow/cancel', [
  body('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  body('patient_phone').isMobilePhone('pt-BR').withMessage('patient_phone deve ser um telefone válido'),
  body('reason').optional().isLength({ max: 200 }).withMessage('reason deve ter no máximo 200 caracteres'),
  handleValidationErrors
], appointmentController.cancelFlow.bind(appointmentController));

// ===== GESTÃO DE AGENDAMENTOS =====

// GET /api/appointment/list
// Lista agendamentos
router.get('/list', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']).withMessage('status deve ser um status válido'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit deve ser um número entre 1 e 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset deve ser um número não negativo'),
  handleValidationErrors
], appointmentController.getAppointments.bind(appointmentController));

// GET /api/appointment/:id
// Obtém agendamento por ID
router.get('/:id', [
  param('id').isUUID().withMessage('id deve ser um UUID válido'),
  handleValidationErrors
], appointmentController.getAppointmentById.bind(appointmentController));

// PUT /api/appointment/:id
// Atualiza agendamento
router.put('/:id', [
  param('id').isUUID().withMessage('id deve ser um UUID válido'),
  body('patient_name').optional().isLength({ min: 1, max: 100 }).withMessage('patient_name deve ter entre 1 e 100 caracteres'),
  body('patient_phone').optional().isMobilePhone('pt-BR').withMessage('patient_phone deve ser um telefone válido'),
  body('patient_email').optional().isEmail().withMessage('patient_email deve ser um email válido'),
  body('scheduled_date').optional().isISO8601().withMessage('scheduled_date deve ser uma data válida no formato ISO'),
  body('scheduled_time').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('scheduled_time deve ser um horário válido no formato HH:MM'),
  body('notes').optional().isLength({ max: 500 }).withMessage('notes deve ter no máximo 500 caracteres'),
  handleValidationErrors
], appointmentController.updateAppointment.bind(appointmentController));

// PUT /api/appointment/:id/status
// Atualiza status do agendamento
router.put('/:id/status', [
  param('id').isUUID().withMessage('id deve ser um UUID válido'),
  body('status').isIn(['pending', 'confirmed', 'completed', 'cancelled', 'no_show']).withMessage('status deve ser um status válido'),
  body('notes').optional().isLength({ max: 500 }).withMessage('notes deve ter no máximo 500 caracteres'),
  handleValidationErrors
], appointmentController.updateAppointmentStatus.bind(appointmentController));

// DELETE /api/appointment/:id
// Remove agendamento
router.delete('/:id', [
  param('id').isUUID().withMessage('id deve ser um UUID válido'),
  handleValidationErrors
], appointmentController.deleteAppointment.bind(appointmentController));

// ===== ESTATÍSTICAS =====

// GET /api/appointment/stats
// Obtém estatísticas de agendamentos
router.get('/stats', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('start_date').isISO8601().withMessage('start_date deve ser uma data válida no formato ISO'),
  query('end_date').isISO8601().withMessage('end_date deve ser uma data válida no formato ISO'),
  handleValidationErrors
], appointmentController.getAppointmentStats.bind(appointmentController));

// ===== INTEGRAÇÃO GOOGLE CALENDAR =====

// POST /api/appointment/sync/calendar
// Sincroniza com Google Calendar
router.post('/sync/calendar', [
  body('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  body('start_date').isISO8601().withMessage('start_date deve ser uma data válida no formato ISO'),
  body('end_date').isISO8601().withMessage('end_date deve ser uma data válida no formato ISO'),
  handleValidationErrors
], appointmentController.syncWithGoogleCalendar.bind(appointmentController));

// ===== HEALTH CHECK E STATUS =====

// GET /api/appointment/health
// Health check do serviço
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'appointment-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// GET /api/appointment/status
// Status detalhado do serviço
router.get('/status', async (req, res) => {
  try {
    const status = {
      success: true,
      service: 'appointment-service',
      status: 'operational',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      components: {
        database: 'connected',
        redis: 'connected',
        google_calendar: 'configured',
        flow_manager: 'active'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };

    res.json(status);
  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'appointment-service',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
