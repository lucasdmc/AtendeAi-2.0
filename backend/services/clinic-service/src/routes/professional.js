const express = require('express');
const router = express.Router();
const professionalController = require('../controllers/professionalController');
const { validateProfessionalData } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimit');

// Aplicar rate limiting e autenticação em todas as rotas
router.use(rateLimiter);
router.use(authenticateToken);

// Rotas de Profissionais
router.post('/:clinicId/professionals', validateProfessionalData, professionalController.createProfessional);
router.get('/:clinicId/professionals', professionalController.getProfessionalsByClinic);
router.get('/:clinicId/professionals/specialty/:specialty', professionalController.getProfessionalsBySpecialty);
router.get('/:clinicId/professionals/available', professionalController.getAvailableProfessionals);
router.get('/:clinicId/professionals/:id', professionalController.getProfessionalById);
router.put('/:clinicId/professionals/:id', validateProfessionalData, professionalController.updateProfessional);
router.delete('/:clinicId/professionals/:id', professionalController.deleteProfessional);

module.exports = router;
