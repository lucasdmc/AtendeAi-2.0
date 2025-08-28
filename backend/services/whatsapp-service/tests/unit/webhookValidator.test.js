const WebhookValidator = require('../../src/middleware/webhookValidation');

describe('WebhookValidator', () => {
    let validator;
    const testVerifyToken = 'test_verify_token_123';
    const testAppSecret = 'test_app_secret_456';

    beforeEach(() => {
        validator = new WebhookValidator(testVerifyToken, testAppSecret);
    });

    describe('validateVerification', () => {
        it('should validate correct verification token', () => {
            const mode = 'subscribe';
            const token = testVerifyToken;
            const challenge = 'challenge_string_123';

            const result = validator.validateVerification(mode, token, challenge);
            expect(result).toBe(challenge);
        });

        it('should throw error for invalid verification token', () => {
            const mode = 'subscribe';
            const token = 'invalid_token';
            const challenge = 'challenge_string_123';

            expect(() => {
                validator.validateVerification(mode, token, challenge);
            }).toThrow('Invalid verification token');
        });

        it('should throw error for non-subscribe mode', () => {
            const mode = 'unsubscribe';
            const token = testVerifyToken;
            const challenge = 'challenge_string_123';

            expect(() => {
                validator.validateVerification(mode, token, challenge);
            }).toThrow('Invalid verification token');
        });
    });

    describe('validateSignature', () => {
        it('should validate correct signature', () => {
            const payload = { test: 'data' };
            const expectedSignature = validator.generateSignature(payload);

            expect(() => {
                validator.validateSignature(payload, expectedSignature);
            }).not.toThrow();
        });

        it('should throw error for invalid signature', () => {
            const payload = { test: 'data' };
            const invalidSignature = 'invalid_signature';

            expect(() => {
                validator.validateSignature(payload, invalidSignature);
            }).toThrow('Invalid webhook signature');
        });

        it('should handle empty payload', () => {
            const payload = {};
            const expectedSignature = validator.generateSignature(payload);

            expect(() => {
                validator.validateSignature(payload, expectedSignature);
            }).not.toThrow();
        });
    });

    describe('generateSignature', () => {
        it('should generate consistent signature for same payload', () => {
            const payload = { test: 'data', number: 123 };
            
            const signature1 = validator.generateSignature(payload);
            const signature2 = validator.generateSignature(payload);
            
            expect(signature1).toBe(signature2);
        });

        it('should generate different signatures for different payloads', () => {
            const payload1 = { test: 'data1' };
            const payload2 = { test: 'data2' };
            
            const signature1 = validator.generateSignature(payload1);
            const signature2 = validator.generateSignature(payload2);
            
            expect(signature1).not.toBe(signature2);
        });

        it('should generate valid hex signature', () => {
            const payload = { test: 'data' };
            const signature = validator.generateSignature(payload);
            
            expect(signature).toMatch(/^[a-f0-9]{64}$/);
        });
    });
});
