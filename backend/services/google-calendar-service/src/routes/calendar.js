// =====================================================
// ROTAS DO GOOGLE CALENDAR SERVICE - ATENDEAÍ 2.0
// =====================================================

const express = require('express');
const router = express.Router();
const GoogleCalendarController = require('../controllers/googleCalendarController');
const { body, query, param, validationResult } = require('express-validator');

const googleCalendarController = new GoogleCalendarController();

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

// ===== ROTAS DE OAUTH2 =====

// GET /api/v1/calendar/oauth/authorize
// Inicia o fluxo de autorização OAuth2
router.get('/oauth/authorize', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('redirect_uri').optional().isURL().withMessage('redirect_uri deve ser uma URL válida'),
  handleValidationErrors
], googleCalendarController.authorize.bind(googleCalendarController));

// GET /api/v1/calendar/oauth/callback
// Callback do OAuth2
router.get('/oauth/callback', [
  query('code').optional().isLength({ min: 1 }).withMessage('code deve ter pelo menos 1 caractere'),
  query('state').optional().isLength({ min: 1 }).withMessage('state deve ter pelo menos 1 caractere'),
  handleValidationErrors
], googleCalendarController.oauthCallback.bind(googleCalendarController));

// ===== CONFIGURAÇÃO DE CLÍNICAS =====

// GET /api/v1/calendar/clinics/:clinic_id/config
// Obtém configuração do Google Calendar de uma clínica
router.get('/clinics/:clinic_id/config', [
  param('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  handleValidationErrors
], googleCalendarController.getClinicConfig.bind(googleCalendarController));

// PUT /api/v1/calendar/clinics/:clinic_id/config
// Atualiza configuração do Google Calendar de uma clínica
router.put('/clinics/:clinic_id/config', [
  param('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  body('google_client_id').optional().isLength({ min: 1 }).withMessage('google_client_id deve ter pelo menos 1 caractere'),
  body('google_client_secret').optional().isLength({ min: 1 }).withMessage('google_client_secret deve ter pelo menos 1 caractere'),
  body('google_refresh_token').optional().isLength({ min: 1 }).withMessage('google_refresh_token deve ter pelo menos 1 caractere'),
  handleValidationErrors
], googleCalendarController.updateClinicConfig.bind(googleCalendarController));

// DELETE /api/v1/calendar/clinics/:clinic_id/config
// Remove configuração do Google Calendar de uma clínica
router.delete('/clinics/:clinic_id/config', [
  param('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  handleValidationErrors
], googleCalendarController.deleteClinicConfig.bind(googleCalendarController));

// ===== GESTÃO DE EVENTOS =====

// POST /api/v1/calendar/events
// Cria novo evento no Google Calendar
router.post('/events', [
  body('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  body('title').isLength({ min: 1, max: 200 }).withMessage('title deve ter entre 1 e 200 caracteres'),
  body('start_time').isISO8601().withMessage('start_time deve ser uma data válida no formato ISO'),
  body('end_time').isISO8601().withMessage('end_time deve ser uma data válida no formato ISO'),
  body('appointment_id').optional().isUUID().withMessage('appointment_id deve ser um UUID válido'),
  body('description').optional().isLength({ max: 1000 }).withMessage('description deve ter no máximo 1000 caracteres'),
  body('attendees').optional().isArray().withMessage('attendees deve ser um array'),
  body('location').optional().isLength({ max: 200 }).withMessage('location deve ter no máximo 200 caracteres'),
  handleValidationErrors
], googleCalendarController.createEvent.bind(googleCalendarController));

// PUT /api/v1/calendar/events/:google_event_id
// Atualiza evento no Google Calendar
router.put('/events/:google_event_id', [
  param('google_event_id').isLength({ min: 1 }).withMessage('google_event_id deve ter pelo menos 1 caractere'),
  body('title').optional().isLength({ min: 1, max: 200 }).withMessage('title deve ter entre 1 e 200 caracteres'),
  body('start_time').optional().isISO8601().withMessage('start_time deve ser uma data válida no formato ISO'),
  body('end_time').optional().isISO8601().withMessage('end_time deve ser uma data válida no formato ISO'),
  body('description').optional().isLength({ max: 1000 }).withMessage('description deve ter no máximo 1000 caracteres'),
  body('attendees').optional().isArray().withMessage('attendees deve ser um array'),
  body('location').optional().isLength({ max: 200 }).withMessage('location deve ter no máximo 200 caracteres'),
  handleValidationErrors
], googleCalendarController.updateEvent.bind(googleCalendarController));

// DELETE /api/v1/calendar/events/:google_event_id
// Remove evento do Google Calendar
router.delete('/events/:google_event_id', [
  param('google_event_id').isLength({ min: 1 }).withMessage('google_event_id deve ter pelo menos 1 caractere'),
  handleValidationErrors
], googleCalendarController.deleteEvent.bind(googleCalendarController));

// GET /api/v1/calendar/events/:google_event_id
// Obtém evento do Google Calendar
router.get('/events/:google_event_id', [
  param('google_event_id').isLength({ min: 1 }).withMessage('google_event_id deve ter pelo menos 1 caractere'),
  handleValidationErrors
], googleCalendarController.getEvent.bind(googleCalendarController));

// GET /api/v1/calendar/events
// Lista eventos do Google Calendar
router.get('/events', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('start_date').optional().isISO8601().withMessage('start_date deve ser uma data válida no formato ISO'),
  query('end_date').optional().isISO8601().withMessage('end_date deve ser uma data válida no formato ISO'),
  query('max_results').optional().isInt({ min: 1, max: 1000 }).withMessage('max_results deve ser um número entre 1 e 1000'),
  handleValidationErrors
], googleCalendarController.listEvents.bind(googleCalendarController));

// POST /api/v1/calendar/events/sync
// Sincroniza eventos com Google Calendar
router.post('/events/sync', [
  body('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  body('start_date').optional().isISO8601().withMessage('start_date deve ser uma data válida no formato ISO'),
  body('end_date').optional().isISO8601().withMessage('end_date deve ser uma data válida no formato ISO'),
  handleValidationErrors
], googleCalendarController.syncEvents.bind(googleCalendarController));

// GET /api/v1/calendar/events/available-slots
// Obtém horários disponíveis
router.get('/events/available-slots', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('date').isISO8601().withMessage('date deve ser uma data válida no formato ISO'),
  query('duration_minutes').optional().isInt({ min: 15, max: 480 }).withMessage('duration_minutes deve ser um número entre 15 e 480'),
  handleValidationErrors
], googleCalendarController.getAvailableSlots.bind(googleCalendarController));

// GET /api/v1/calendar/events/upcoming
// Obtém eventos próximos
router.get('/events/upcoming', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('hours').optional().isInt({ min: 1, max: 168 }).withMessage('hours deve ser um número entre 1 e 168'),
  handleValidationErrors
], googleCalendarController.getUpcomingEvents.bind(googleCalendarController));

// GET /api/v1/calendar/events/conflicts
// Obtém conflitos de horário
router.get('/events/conflicts', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('start_time').isISO8601().withMessage('start_time deve ser uma data válida no formato ISO'),
  query('end_time').isISO8601().withMessage('end_time deve ser uma data válida no formato ISO'),
  query('exclude_event_id').optional().isUUID().withMessage('exclude_event_id deve ser um UUID válido'),
  handleValidationErrors
], googleCalendarController.getConflicts.bind(googleCalendarController));

// GET /api/v1/calendar/events/stats
// Obtém estatísticas de eventos
router.get('/events/stats', [
  query('clinic_id').isUUID().withMessage('clinic_id deve ser um UUID válido'),
  query('start_date').isISO8601().withMessage('start_date deve ser uma data válida no formato ISO'),
  query('end_date').isISO8601().withMessage('end_date deve ser uma data válida no formato ISO'),
  handleValidationErrors
], googleCalendarController.getEventStats.bind(googleCalendarController));

// ===== CONEXÃO E CONTA =====

// GET /api/v1/calendar/connection/test
// Testa conexão com Google Calendar
router.get('/connection/test', googleCalendarController.testConnection.bind(googleCalendarController));

// GET /api/v1/calendar/account/info
// Obtém informações da conta
router.get('/account/info', googleCalendarController.getCalendarInfo.bind(googleCalendarController));

// POST /api/v1/calendar/token/refresh
// Atualiza token de acesso
router.post('/token/refresh', googleCalendarController.refreshToken.bind(googleCalendarController));

module.exports = router;
