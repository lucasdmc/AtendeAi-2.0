class HealthChecker {
    constructor() {
        this.checks = [
            { name: 'meta_api', check: this.checkMetaAPI.bind(this) },
            { name: 'conversation_service', check: this.checkConversationService.bind(this) },
            { name: 'clinic_service', check: this.checkClinicService.bind(this) },
            { name: 'database', check: this.checkDatabase.bind(this) }
        ];
    }

    async runHealthChecks() {
        const results = {};
        
        for (const check of this.checks) {
            try {
                const startTime = Date.now();
                await check.check();
                const duration = Date.now() - startTime;
                
                results[check.name] = {
                    status: 'healthy',
                    duration,
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                results[check.name] = {
                    status: 'unhealthy',
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        }
        
        return results;
    }

    async checkMetaAPI() {
        const MetaWhatsAppAPI = require('../services/metaWhatsAppAPI');
        const metaAPI = new MetaWhatsAppAPI();
        await metaAPI.verifyCredentials();
    }

    async checkConversationService() {
        const ConversationServiceClient = require('../clients/conversationServiceClient');
        const client = new ConversationServiceClient();
        await client.makeRequest('GET', '/health');
    }

    async checkClinicService() {
        const ClinicServiceClient = require('../clients/clinicServiceClient');
        const client = new ClinicServiceClient();
        await client.makeRequest('GET', '/health');
    }

    async checkDatabase() {
        const db = require('../config/database');
        await db.query('SELECT 1');
    }

    isHealthy(results) {
        return Object.values(results).every(check => check.status === 'healthy');
    }

    getOverallStatus(results) {
        const healthyCount = Object.values(results).filter(check => check.status === 'healthy').length;
        const totalCount = Object.keys(results).length;
        
        if (healthyCount === totalCount) {
            return 'healthy';
        } else if (healthyCount === 0) {
            return 'unhealthy';
        } else {
            return 'degraded';
        }
    }
}

module.exports = HealthChecker;
