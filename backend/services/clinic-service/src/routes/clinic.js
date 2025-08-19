const express = require('express');
const router = express.Router();
const clinicController = require('../controllers/clinicController');
const { validateClinicData, validateContextualizationData } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimit');

// Aplicar rate limiting e autenticação em todas as rotas
router.use(rateLimiter);
router.use(authenticateToken);

// Rotas de Clínicas
router.post('/', validateClinicData, clinicController.createClinic);
router.get('/', clinicController.getAllClinics);
router.get('/whatsapp/:phone', clinicController.getClinicByWhatsAppPhone);
router.get('/:id', clinicController.getClinic);
router.put('/:id', validateClinicData, clinicController.updateClinic);
router.delete('/:id', clinicController.deleteClinic);

// Rotas de Contextualização
router.get('/:id/contextualization', clinicController.getClinicContextualization);
router.put('/:id/contextualization', validateContextualizationData, clinicController.updateClinicContextualization);
router.get('/:id/intentions', clinicController.getClinicIntentions);
router.get('/:id/personality', clinicController.getClinicPersonality);
router.get('/:id/behavior', clinicController.getClinicBehavior);
router.get('/:id/working-hours', clinicController.getClinicWorkingHours);
router.get('/:id/appointment-policies', clinicController.getClinicAppointmentPolicies);
router.get('/:id/calendar-mappings', clinicController.getClinicCalendarMappings);
router.get('/:id/services', clinicController.getClinicServices);
router.get('/:id/professionals', clinicController.getClinicProfessionals);

// Rotas de Cache
router.delete('/:id/contextualization/cache', clinicController.clearContextualizationCache);
router.get('/contextualization/cache/stats', clinicController.getContextualizationCacheStats);

module.exports = router;
