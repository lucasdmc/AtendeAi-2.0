const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class MetaWhatsAppAPI {
    constructor() {
        this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
        this.baseURL = 'https://graph.facebook.com/v18.0';
    }

    async sendMessage(messageData) {
        const url = `${this.baseURL}/${this.phoneNumberId}/messages`;
        
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageData)
        };

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Meta API error: ${errorData.error?.message || response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            throw new Error(`Failed to send message via Meta API: ${error.message}`);
        }
    }

    async verifyCredentials() {
        const url = `${this.baseURL}/${this.phoneNumberId}`;
        
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        };

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`Invalid credentials: ${response.statusText}`);
            }
            
            const data = await response.json();
            return {
                valid: true,
                phoneNumber: data.phone_number,
                verifiedName: data.verified_name,
                codeVerificationStatus: data.code_verification_status
            };
        } catch (error) {
            throw new Error(`Credential verification failed: ${error.message}`);
        }
    }

    async getMessageStatus(messageId) {
        const url = `${this.baseURL}/${messageId}`;
        
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        };

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`Failed to get message status: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            throw new Error(`Failed to get message status: ${error.message}`);
        }
    }

    async getBusinessProfile() {
        const url = `${this.baseURL}/${this.businessAccountId}`;
        
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        };

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`Failed to get business profile: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            throw new Error(`Failed to get business profile: ${error.message}`);
        }
    }
}

module.exports = MetaWhatsAppAPI;
