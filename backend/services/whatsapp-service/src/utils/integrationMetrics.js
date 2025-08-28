class IntegrationMetrics {
    constructor() {
        this.metrics = {
            webhooksReceived: 0,
            messagesProcessed: 0,
            messagesFailed: 0,
            aiResponseTime: [],
            metaAPILatency: [],
            errorCounts: {}
        };
    }

    recordWebhookReceived() {
        this.metrics.webhooksReceived++;
        this.emitMetric('webhooks_received_total', this.metrics.webhooksReceived);
    }

    recordMessageProcessed(processingTime) {
        this.metrics.messagesProcessed++;
        this.metrics.aiResponseTime.push(processingTime);
        
        this.emitMetric('messages_processed_total', this.metrics.messagesProcessed);
        this.emitMetric('ai_response_time_seconds', processingTime / 1000);
    }

    recordFailure(errorType, errorMessage) {
        this.metrics.messagesFailed++;
        this.metrics.errorCounts[errorType] = (this.metrics.errorCounts[errorType] || 0) + 1;
        
        this.emitMetric('messages_failed_total', this.metrics.messagesFailed);
        this.emitMetric(`errors_${errorType}_total`, this.metrics.errorCounts[errorType]);
        
        console.error(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'ERROR',
            errorType,
            errorMessage,
            metrics: this.metrics
        }));
    }

    emitMetric(name, value) {
        if (global.prometheusClient) {
            global.prometheusClient.gauge(name, value);
        }
    }

    getSummary() {
        const avgResponseTime = this.metrics.aiResponseTime.length > 0 
            ? this.metrics.aiResponseTime.reduce((a, b) => a + b, 0) / this.metrics.aiResponseTime.length
            : 0;

        return {
            webhooksReceived: this.metrics.webhooksReceived,
            messagesProcessed: this.metrics.messagesProcessed,
            messagesFailed: this.metrics.messagesFailed,
            successRate: this.metrics.messagesProcessed / (this.metrics.messagesProcessed + this.metrics.messagesFailed),
            averageResponseTime: avgResponseTime,
            errorBreakdown: this.metrics.errorCounts
        };
    }

    reset() {
        this.metrics = {
            webhooksReceived: 0,
            messagesProcessed: 0,
            messagesFailed: 0,
            aiResponseTime: [],
            metaAPILatency: [],
            errorCounts: {}
        };
    }
}

module.exports = IntegrationMetrics;
