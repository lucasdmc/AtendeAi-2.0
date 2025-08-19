const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// Rotas de saúde (sem autenticação)
router.get('/', healthController.healthCheck);
router.get('/ready', healthController.readinessCheck);
router.get('/live', healthController.livenessCheck);
router.get('/metrics', healthController.getMetrics);

module.exports = router;
