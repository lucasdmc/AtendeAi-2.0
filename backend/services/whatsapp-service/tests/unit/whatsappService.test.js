const WhatsAppService = require('../../src/services/whatsappService');

// Mock das dependências
jest.mock('../../src/services/metaWhatsAppAPI');
jest.mock('../../src/utils/whatsappMessageAdapter');
jest.mock('../../src/utils/circuitBreaker');
jest.mock('../../src/utils/retryStrategy');
jest.mock('../../src/utils/fallbackStrategy');
jest.mock('../../src/clients/conversationServiceClient');
jest.mock('../../src/clients/clinicServiceClient');
jest.mock('../../src/config/database');

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

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Mock das dependências
        mockMetaAPI = {
            sendMessage: jest.fn(),
            verifyCredentials: jest.fn()
        };
        
        mockMessageAdapter = {
            adaptIncomingMessage: jest.fn(),
            adaptOutgoingMessage: jest.fn()
        };
        
        mockCircuitBreaker = {
            execute: jest.fn()
        };
        
        mockRetryStrategy = {
            execute: jest.fn()
        };
        
        mockFallbackStrategy = {
            getResponse: jest.fn()
        };
        
        mockConversationService = {
            processMessage: jest.fn()
        };
        
        mockClinicService = {
            getClinicContext: jest.fn(),
            getWhatsAppConfig: jest.fn()
        };
        
        mockDatabase = {
            query: jest.fn()
        };

        // Mock dos módulos
        jest.doMock('../../src/services/metaWhatsAppAPI', () => mockMetaAPI);
        jest.doMock('../../src/utils/whatsappMessageAdapter', () => mockMessageAdapter);
        jest.doMock('../../src/utils/circuitBreaker', () => mockCircuitBreaker);
        jest.doMock('../../src/utils/retryStrategy', () => mockRetryStrategy);
        jest.doMock('../../src/utils/fallbackStrategy', () => mockFallbackStrategy);
        jest.doMock('../../src/clients/conversationServiceClient', () => mockConversationService);
        jest.doMock('../../src/clients/clinicServiceClient', () => mockClinicService);
        jest.doMock('../../src/config/database', () => mockDatabase);

        whatsappService = new WhatsAppService();
    });

    describe('processWebhook', () => {
        it('should process webhook successfully', async () => {
            const mockPayload = { test: 'payload' };
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
            const mockPayload = { test: 'payload' };
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

            mockClinicService.getClinicContext.mockResolvedValue(mockContext);

            const result = await whatsappService.getClinicContext(mockClinicId);

            expect(result).toBe(mockContext);
            expect(mockClinicService.getClinicContext).toHaveBeenCalledWith(mockClinicId);
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

            mockClinicService.getWhatsAppConfig.mockResolvedValue(mockConfig);

            const result = await whatsappService.getWhatsAppConfig(mockClinicId);

            expect(result).toBe(mockConfig);
            expect(mockClinicService.getWhatsAppConfig).toHaveBeenCalledWith(mockClinicId);
        });

        it('should handle clinic service errors', async () => {
            const mockClinicId = 'clinic-123';

            mockClinicService.getWhatsAppConfig.mockRejectedValue(new Error('Service unavailable'));

            const result = await whatsappService.getWhatsAppConfig(mockClinicId);

            expect(result).toBeNull();
        });
    });
});
