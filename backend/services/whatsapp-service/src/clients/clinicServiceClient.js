class ClinicServiceClient {
    constructor() {
        this.baseURL = process.env.CLINIC_SERVICE_URL || 'http://localhost:3003';
        this.timeout = 10000;
    }

    async getClinicContext(clinicId) {
        const response = await this.makeRequest('GET', `/api/clinics/${clinicId}/context`);
        
        return {
            aiPersonality: response.data.ai_personality,
            aiBehavior: response.data.ai_behavior,
            workingHours: response.data.working_hours,
            schedulingPolicies: response.data.scheduling_policies,
            customSettings: response.data.custom_settings
        };
    }

    async getWhatsAppConfig(clinicId) {
        const response = await this.makeRequest('GET', `/api/clinics/${clinicId}/whatsapp-config`);
        
        return {
            phoneNumber: response.data.phone_number,
            autoReplyEnabled: response.data.auto_reply_enabled,
            businessHours: response.data.business_hours,
            outOfHoursMessage: response.data.out_of_hours_message,
            escalationSettings: response.data.escalation_settings
        };
    }

    async makeRequest(method, endpoint) {
        const url = `${this.baseURL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CLINIC_SERVICE_TOKEN}`
            },
            timeout: this.timeout
        };

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            throw new Error(`Clinic Service error: ${error.message}`);
        }
    }
}

module.exports = ClinicServiceClient;
