const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class ConversationServiceClient {
    constructor() {
        this.baseURL = process.env.CONVERSATION_SERVICE_URL || 'http://localhost:3005';
        this.timeout = 30000;
    }

    async processMessage(request) {
        const payload = {
            clinicId: request.clinicId,
            message: request.message,
            customerPhone: request.customerPhone,
            messageType: request.messageType,
            context: request.context || {},
            timestamp: new Date().toISOString()
        };

        const response = await this.makeRequest('POST', '/api/conversation/process', payload);
        
        return {
            text: response.data.response,
            intent: response.data.intent,
            confidence: response.data.confidence,
            metadata: response.data.metadata,
            conversationId: response.data.conversationId
        };
    }

    async createConversation(request) {
        const payload = {
            clinicId: request.clinicId,
            customerPhone: request.customerPhone,
            customerName: request.customerName,
            initialMessage: request.initialMessage
        };

        const response = await this.makeRequest('POST', '/api/conversation/create', payload);
        
        return {
            conversationId: response.data.id,
            status: response.data.status,
            createdAt: response.data.createdAt
        };
    }

    async getConversationHistory(conversationId) {
        const response = await this.makeRequest('GET', `/api/conversation/${conversationId}/history`);
        
        return {
            messages: response.data.messages,
            metadata: response.data.metadata
        };
    }

    async makeRequest(method, endpoint, data = null) {
        const url = `${this.baseURL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CONVERSATION_SERVICE_TOKEN}`
            },
            timeout: this.timeout
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            throw new Error(`Conversation Service error: ${error.message}`);
        }
    }
}

module.exports = ConversationServiceClient;
