const crypto = require('crypto');

class WebhookValidator {
    constructor(verifyToken, appSecret) {
        this.verifyToken = verifyToken;
        this.appSecret = appSecret;
    }

    validateVerification(mode, token, challenge) {
        if (mode === 'subscribe' && token === this.verifyToken) {
            return challenge;
        }
        throw new Error('Invalid verification token');
    }

    validateSignature(payload, signature) {
        const expectedSignature = this.generateSignature(payload);
        if (signature !== expectedSignature) {
            throw new Error('Invalid webhook signature');
        }
        return true;
    }

    generateSignature(payload) {
        return crypto
            .createHmac('sha256', this.appSecret)
            .update(JSON.stringify(payload))
            .digest('hex');
    }
}

module.exports = WebhookValidator;
