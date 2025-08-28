const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const whatsappRoutes = require('./routes/whatsapp');
const healthRoutes = require('./routes/health');
const HealthChecker = require('./utils/healthChecker');
const IntegrationMetrics = require('./utils/integrationMetrics');

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware de segurança
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite por IP
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Rate limiting específico para webhooks
const webhookLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 1000, // limite mais alto para webhooks
    message: 'Too many webhook requests, please try again later.'
});
app.use('/webhook/', webhookLimiter);

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Rotas
app.use('/', whatsappRoutes);
app.use('/health', healthRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const healthChecker = new HealthChecker();
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

// Métricas endpoint
app.get('/metrics', (req, res) => {
    try {
        const metrics = global.integrationMetrics || new IntegrationMetrics();
        const summary = metrics.getSummary();
        
        res.json({
            service: 'whatsapp-service',
            timestamp: new Date().toISOString(),
            metrics: summary
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

// Endpoint de status geral
app.get('/status', (req, res) => {
    res.json({
        service: 'whatsapp-service',
        status: 'operational',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// Inicializar métricas globais
global.integrationMetrics = new IntegrationMetrics();

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`WhatsApp Service running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Metrics: http://localhost:${PORT}/metrics`);
    console.log(`Status: http://localhost:${PORT}/status`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

module.exports = app;
