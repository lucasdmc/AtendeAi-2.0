const express = require('express');
const router = express.Router();
const clinicController = require('../controllers/clinicController');
const { validateClinicData, validateContextualizationData } = require('../middleware/validation');
const { authenticateToken, withTenant, requireAdminLify } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimit');

// Aplicar rate limiting e autenticação em todas as rotas
router.use(rateLimiter);
router.use(authenticateToken);

// Rotas de Clínicas
router.post('/', requireAdminLify, validateClinicData, clinicController.createClinic);
router.get('/', clinicController.getAllClinics);
router.get('/whatsapp/:phone', clinicController.getClinicByWhatsAppPhone);
router.get('/:id', withTenant, clinicController.getClinic);
router.put('/:id', withTenant, validateClinicData, clinicController.updateClinic);
router.delete('/:id', requireAdminLify, clinicController.deleteClinic);

// Rotas de Contextualização
router.get('/:id/contextualization', withTenant, clinicController.getClinicContextualization);
router.put('/:id/contextualization', withTenant, validateContextualizationData, clinicController.updateClinicContextualization);
router.get('/:id/intentions', withTenant, clinicController.getClinicIntentions);
router.get('/:id/personality', withTenant, clinicController.getClinicPersonality);
router.get('/:id/behavior', withTenant, clinicController.getClinicBehavior);
router.get('/:id/working-hours', withTenant, clinicController.getClinicWorkingHours);
router.get('/:id/appointment-policies', withTenant, clinicController.getClinicAppointmentPolicies);
router.get('/:id/calendar-mappings', withTenant, clinicController.getClinicCalendarMappings);
router.get('/:id/services', withTenant, clinicController.getClinicServices);
router.get('/:id/professionals', withTenant, clinicController.getClinicProfessionals);

// Rotas de Cache
router.delete('/:id/contextualization/cache', clinicController.clearContextualizationCache);
router.get('/contextualization/cache/stats', clinicController.getContextualizationCacheStats);

module.exports = router;
