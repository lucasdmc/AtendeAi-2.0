const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { validateServiceData } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimit');

// Aplicar rate limiting e autenticação em todas as rotas
router.use(rateLimiter);
router.use(authenticateToken);

// Rotas de Serviços
router.post('/:clinicId/services', validateServiceData, serviceController.createService);
router.get('/:clinicId/services', serviceController.getServicesByClinic);
router.get('/:clinicId/services/category/:category', serviceController.getServicesByCategory);
router.get('/:clinicId/services/specialty/:specialty', serviceController.getServicesBySpecialty);
router.get('/:clinicId/services/duration', serviceController.getServicesByDuration);
router.get('/:clinicId/services/categories', serviceController.getServiceCategories);
router.get('/:clinicId/services/specialties', serviceController.getServiceSpecialties);
router.get('/:clinicId/services/:id', serviceController.getServiceById);
router.put('/:clinicId/services/:id', validateServiceData, serviceController.updateService);
router.delete('/:clinicId/services/:id', serviceController.deleteService);

module.exports = router;
