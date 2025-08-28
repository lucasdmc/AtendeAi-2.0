const express = require('express');
const HealthChecker = require('../utils/healthChecker');

const router = express.Router();
const healthChecker = new HealthChecker();

// Health check básico
router.get('/', async (req, res) => {
    try {
        const results = await healthChecker.runHealthChecks();
        const overallStatus = healthChecker.getOverallStatus(results);
        
        res.status(overallStatus === 'healthy' ? 200 : 503).json({
            service: 'whatsapp-service',
            status: overallStatus,
            timestamp: new Date().toISOString(),
            checks: results
        });
    } catch (error) {
        res.status(500).json({
            service: 'whatsapp-service',
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Health check detalhado
router.get('/detailed', async (req, res) => {
    try {
        const results = await healthChecker.runHealthChecks();
        const overallStatus = healthChecker.getOverallStatus(results);
        
        const detailedResults = {
            service: 'whatsapp-service',
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            environment: process.env.NODE_ENV || 'development',
            version: '2.0.0',
            checks: results
        };
        
        res.status(overallStatus === 'healthy' ? 200 : 503).json(detailedResults);
    } catch (error) {
        res.status(500).json({
            service: 'whatsapp-service',
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Health check específico
router.get('/:checkName', async (req, res) => {
    try {
        const { checkName } = req.params;
        const check = healthChecker.checks.find(c => c.name === checkName);
        
        if (!check) {
            return res.status(404).json({
                success: false,
                error: `Health check '${checkName}' not found`,
                availableChecks: healthChecker.checks.map(c => c.name)
            });
        }
        
        const startTime = Date.now();
        await check.check();
        const duration = Date.now() - startTime;
        
        res.json({
            service: 'whatsapp-service',
            check: checkName,
            status: 'healthy',
            duration,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            service: 'whatsapp-service',
            check: req.params.checkName,
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
