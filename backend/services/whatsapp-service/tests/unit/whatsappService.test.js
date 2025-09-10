import { describe, test, expect, beforeEach, vi } from 'vitest';
import WhatsAppService from '../../src/services/whatsappService';

// Mock das dependências
vi.mock('../../src/services/metaWhatsAppAPI', () => ({
  default: {
    sendMessage: vi.fn(),
    verifyCredentials: vi.fn()
  }
}));

vi.mock('../../src/utils/whatsappMessageAdapter', () => ({
  default: {
    adaptIncomingMessage: vi.fn(),
    adaptOutgoingMessage: vi.fn()
  }
}));

vi.mock('../../src/utils/circuitBreaker', () => ({
  default: vi.fn().mockImplementation(() => ({
    execute: vi.fn()
  }))
}));

vi.mock('../../src/utils/retryStrategy', () => ({
  default: vi.fn().mockImplementation(() => ({
    execute: vi.fn()
  }))
}));

vi.mock('../../src/utils/fallbackStrategy', () => ({
  default: vi.fn().mockImplementation(() => ({
    getResponse: vi.fn()
  }))
}));

vi.mock('../../src/clients/conversationServiceClient', () => ({
  default: {
    processMessage: vi.fn()
  }
}));

vi.mock('../../src/clients/clinicServiceClient', () => ({
  default: {
    getClinicContext: vi.fn(),
    getWhatsAppConfig: vi.fn()
  }
}));

vi.mock('../../src/config/database', () => ({
  default: {
    query: vi.fn()
  }
}));

describe('WhatsAppService', () => {
    let whatsappService;
    let mockMetaAPI;
    let mockMessageAdapter;
    let mockCircuitBreaker;
    let mockRetryStrategy;
    let mockFallbackStrategy;
    let mockConversationService;
    let mockClinicService;
    let mockDatabase;

    beforeEach(async () => {
        // Reset mocks
        vi.clearAllMocks();
        
        // Import mocked modules
        const { default: MetaAPI } = await import('../../src/services/metaWhatsAppAPI');
        const { default: MessageAdapter } = await import('../../src/utils/whatsappMessageAdapter');
        const { default: CircuitBreaker } = await import('../../src/utils/circuitBreaker');
        const { default: RetryStrategy } = await import('../../src/utils/retryStrategy');
        const { default: FallbackStrategy } = await import('../../src/utils/fallbackStrategy');
        const { default: ConversationService } = await import('../../src/clients/conversationServiceClient');
        const { default: ClinicService } = await import('../../src/clients/clinicServiceClient');
        const { default: Database } = await import('../../src/config/database');

        // Setup mock instances
        mockMetaAPI = MetaAPI;
        mockMessageAdapter = MessageAdapter;
        mockCircuitBreaker = new CircuitBreaker();
        mockRetryStrategy = new RetryStrategy();
        mockFallbackStrategy = new FallbackStrategy();
        mockConversationService = ConversationService;
        mockClinicService = ClinicService;
        mockDatabase = Database;

        whatsappService = new WhatsAppService();
    });

    describe('processWebhook', () => {
        it('should process webhook successfully', async () => {
            const mockPayload = {
                entry: [{
                    changes: [{
                        value: {
                            messages: [{
                                id: 'msg-123',
                                from: '+5511999999999',
                                text: { body: 'Hello' },
                                timestamp: '1234567890'
                            }]
                        }
                    }]
                }]
            };
            const mockSignature = 'valid_signature';
            const mockClinicId = 'clinic-123';
            
            const mockAdaptedMessage = {
                id: 'msg-123',
                fromPhone: '+5511999999999',
                toPhone: '+5511888888888',
                messageType: 'text',
                content: { body: 'Hello' },
                timestamp: new Date(),
                clinicId: mockClinicId
            };
            
            const mockAIResponse = {
                text: 'Hi there!',
                intent: 'greeting'
            };
            
            const mockResponse = {
                toPhone: '+5511999999999',
                messageType: 'text',
                content: 'Hi there!'
            };

            mockMessageAdapter.adaptIncomingMessage.mockReturnValue(mockAdaptedMessage);
            mockConversationService.processMessage.mockResolvedValue(mockAIResponse);
            mockRetryStrategy.execute.mockResolvedValue(mockResponse);
            mockMetaAPI.sendMessage.mockResolvedValue({ id: 'sent-msg-123' });
            mockDatabase.query.mockResolvedValue({ rows: [{ id: 'db-msg-123' }] });

            const result = await whatsappService.processWebhook(mockPayload, mockSignature, mockClinicId);

            expect(result.success).toBe(true);
            expect(result.messageId).toBe('msg-123');
            expect(mockMessageAdapter.adaptIncomingMessage).toHaveBeenCalledWith(mockPayload);
            expect(mockConversationService.processMessage).toHaveBeenCalled();
            expect(mockMetaAPI.sendMessage).toHaveBeenCalled();
            expect(mockDatabase.query).toHaveBeenCalled();
        });

        it('should handle errors during webhook processing', async () => {
            const mockPayload = {
                entry: [{
                    changes: [{
                        value: {
                            messages: [{
                                id: 'msg-123',
                                from: '+5511999999999',
                                text: { body: 'Hello' },
                                timestamp: '1234567890'
                            }]
                        }
                    }]
                }]
            };
            const mockSignature = 'valid_signature';
            const mockClinicId = 'clinic-123';
            
            const mockError = new Error('AI processing failed');
            
            mockMessageAdapter.adaptIncomingMessage.mockReturnValue({
                id: 'msg-123',
                clinicId: mockClinicId
            });
            mockConversationService.processMessage.mockRejectedValue(mockError);
            mockDatabase.query.mockResolvedValue({ rows: [] });

            await expect(
                whatsappService.processWebhook(mockPayload, mockSignature, mockClinicId)
            ).rejects.toThrow('AI processing failed');

            expect(mockDatabase.query).toHaveBeenCalled(); // Error logging
        });
    });

    describe('sendMessage', () => {
        it('should send message successfully', async () => {
            const mockMessage = {
                toPhone: '+5511999999999',
                messageType: 'text',
                content: 'Hello'
            };
            
            const mockAdaptedMessage = {
                messaging_product: 'whatsapp',
                to: '+5511999999999',
                type: 'text',
                text: { body: 'Hello' }
            };
            
            const mockResponse = { id: 'sent-msg-123' };

            mockMessageAdapter.adaptOutgoingMessage.mockReturnValue(mockAdaptedMessage);
            mockCircuitBreaker.execute.mockResolvedValue(mockResponse);

            const result = await whatsappService.sendMessage(mockMessage);

            expect(result).toBe(mockResponse);
            expect(mockMessageAdapter.adaptOutgoingMessage).toHaveBeenCalledWith(mockMessage);
            expect(mockCircuitBreaker.execute).toHaveBeenCalled();
        });
    });

    describe('processWithAI', () => {
        it('should process message with AI successfully', async () => {
            const mockMessage = {
                clinicId: 'clinic-123',
                content: { body: 'Hello' },
                fromPhone: '+5511999999999',
                messageType: 'text'
            };
            
            const mockAIResponse = {
                text: 'Hi there!',
                intent: 'greeting'
            };

            mockConversationService.processMessage.mockResolvedValue(mockAIResponse);
            mockRetryStrategy.execute.mockResolvedValue(mockAIResponse);

            const result = await whatsappService.processWithAI(mockMessage);

            expect(result.toPhone).toBe('+5511999999999');
            expect(result.messageType).toBe('text');
            expect(result.content).toBe('Hi there!');
            expect(mockRetryStrategy.execute).toHaveBeenCalled();
        });
    });

    describe('persistMessage', () => {
        it('should persist message successfully', async () => {
            const mockMessage = {
                clinicId: 'clinic-123',
                id: 'msg-123',
                fromPhone: '+5511999999999',
                toPhone: '+5511888888888',
                messageType: 'text',
                content: { body: 'Hello' },
                timestamp: new Date()
            };
            
            const mockResponse = {
                toPhone: '+5511999999999',
                content: 'Hi there!'
            };

            mockDatabase.query.mockResolvedValue({ rows: [{ id: 'db-msg-123' }] });

            const result = await whatsappService.persistMessage(mockMessage, mockResponse);

            expect(result.id).toBe('db-msg-123');
            expect(mockDatabase.query).toHaveBeenCalled();
        });

        it('should handle database persistence errors', async () => {
            const mockMessage = {
                clinicId: 'clinic-123',
                id: 'msg-123'
            };
            
            const mockResponse = { content: 'Hi there!' };

            mockDatabase.query.mockRejectedValue(new Error('Database connection failed'));

            await expect(
                whatsappService.persistMessage(mockMessage, mockResponse)
            ).rejects.toThrow('Database persistence failed');
        });
    });

    describe('getClinicContext', () => {
        it('should get clinic context successfully', async () => {
            const mockClinicId = 'clinic-123';
            const mockContext = {
                aiPersonality: 'friendly',
                workingHours: '9-18'
            };
            
            // Mock the clinic service method properly
            const mockClinicServiceInstance = {
                getClinicContext: vi.fn().mockResolvedValue(mockContext)
            };
            
            // Replace the mock implementation
            vi.doMock('../../src/clients/clinicServiceClient', () => ({
                default: mockClinicServiceInstance
            }));
            
            const result = await whatsappService.getClinicContext(mockClinicId);
            
            expect(result).toBe(mockContext);
            expect(mockClinicServiceInstance.getClinicContext).toHaveBeenCalledWith(mockClinicId);
        });

        it('should handle clinic service errors', async () => {
            const mockClinicId = 'clinic-123';

            mockClinicService.getClinicContext.mockRejectedValue(new Error('Service unavailable'));

            const result = await whatsappService.getClinicContext(mockClinicId);

            expect(result).toBeNull();
        });
    });

    describe('getWhatsAppConfig', () => {
        it('should get WhatsApp config successfully', async () => {
            const mockClinicId = 'clinic-123';
            const mockConfig = {
                phoneNumber: '+5511888888888',
                autoReplyEnabled: true
            };
            
            // Mock the clinic service method properly
            const mockClinicServiceInstance = {
                getWhatsAppConfig: vi.fn().mockResolvedValue(mockConfig)
            };
            
            // Replace the mock implementation
            vi.doMock('../../src/clients/clinicServiceClient', () => ({
                default: mockClinicServiceInstance
            }));
            
            const result = await whatsappService.getWhatsAppConfig(mockClinicId);
            
            expect(result).toBe(mockConfig);
            expect(mockClinicServiceInstance.getWhatsAppConfig).toHaveBeenCalledWith(mockClinicId);
        });

        it('should handle clinic service errors', async () => {
            const mockClinicId = 'clinic-123';

            mockClinicService.getWhatsAppConfig.mockRejectedValue(new Error('Service unavailable'));

            const result = await whatsappService.getWhatsAppConfig(mockClinicId);

            expect(result).toBeNull();
        });
    });
});
