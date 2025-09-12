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
router.get('/:clinicId/professionals', professionalController.getProfessionals);
router.get('/:clinicId/professionals/:id', professionalController.getProfessional);

module.exports = router;
