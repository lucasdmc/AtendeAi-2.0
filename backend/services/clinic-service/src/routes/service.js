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
router.get('/:clinicId/services', serviceController.getServices);
router.get('/:clinicId/services/:id', serviceController.getService);

module.exports = router;
