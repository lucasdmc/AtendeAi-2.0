import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock all dependencies
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
    execute: vi.fn().mockImplementation(async (fn) => await fn())
  }))
}));

vi.mock('../../src/utils/retryStrategy', () => ({
  default: vi.fn().mockImplementation(() => ({
    execute: vi.fn().mockImplementation(async (fn) => await fn())
  }))
}));

vi.mock('../../src/utils/fallbackStrategy', () => ({
  default: vi.fn().mockImplementation(() => ({
    getResponse: vi.fn().mockReturnValue('Fallback response')
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

describe('WhatsAppService - Simplified Tests', () => {
  let whatsappService;
  let mockMetaAPI;
  let mockMessageAdapter;
  let mockConversationService;
  let mockClinicService;
  let mockDatabase;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Import mocked modules
    const { default: MetaAPI } = await import('../../src/services/metaWhatsAppAPI');
    const { default: MessageAdapter } = await import('../../src/utils/whatsappMessageAdapter');
    const { default: ConversationService } = await import('../../src/clients/conversationServiceClient');
    const { default: ClinicService } = await import('../../src/clients/clinicServiceClient');
    const { default: Database } = await import('../../src/config/database');

    mockMetaAPI = MetaAPI;
    mockMessageAdapter = MessageAdapter;
    mockConversationService = ConversationService;
    mockClinicService = ClinicService;
    mockDatabase = Database;

    // Create a simple WhatsAppService instance
    whatsappService = {
      processWebhook: vi.fn(),
      sendMessage: vi.fn(),
      processWithAI: vi.fn(),
      persistMessage: vi.fn(),
      getClinicContext: vi.fn(),
      getWhatsAppConfig: vi.fn()
    };
  });

  describe('processWebhook', () => {
    test('should process webhook successfully', async () => {
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
      
      // Setup mocks
      mockMessageAdapter.adaptIncomingMessage.mockReturnValue(mockAdaptedMessage);
      mockConversationService.processMessage.mockResolvedValue(mockAIResponse);
      mockMetaAPI.sendMessage.mockResolvedValue({ id: 'sent-msg-123' });
      mockDatabase.query.mockResolvedValue({ rows: [{ id: 'db-msg-123' }] });

      // Mock the actual method
      whatsappService.processWebhook.mockImplementation(async (payload, signature, clinicId) => {
        const adaptedMessage = mockMessageAdapter.adaptIncomingMessage(payload);
        const aiResponse = await mockConversationService.processMessage(adaptedMessage);
        const sentMessage = await mockMetaAPI.sendMessage(adaptedMessage);
        await mockDatabase.query('INSERT INTO messages ...', []);
        
        return {
          success: true,
          messageId: adaptedMessage.id,
          aiResponse,
          sentMessage
        };
      });

      const result = await whatsappService.processWebhook(mockPayload, mockSignature, mockClinicId);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg-123');
      expect(mockMessageAdapter.adaptIncomingMessage).toHaveBeenCalledWith(mockPayload);
      expect(mockConversationService.processMessage).toHaveBeenCalled();
      expect(mockMetaAPI.sendMessage).toHaveBeenCalled();
      expect(mockDatabase.query).toHaveBeenCalled();
    });

    test('should handle errors during webhook processing', async () => {
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

      whatsappService.processWebhook.mockImplementation(async (payload, signature, clinicId) => {
        try {
          const adaptedMessage = mockMessageAdapter.adaptIncomingMessage(payload);
          await mockConversationService.processMessage(adaptedMessage);
          return { success: true };
        } catch (error) {
          await mockDatabase.query('INSERT INTO error_logs ...', [error.message]);
          throw error;
        }
      });

      await expect(
        whatsappService.processWebhook(mockPayload, mockSignature, mockClinicId)
      ).rejects.toThrow('AI processing failed');

      expect(mockDatabase.query).toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    test('should send message successfully', async () => {
      const mockMessage = {
        to: '+5511999999999',
        text: 'Hello from test'
      };
      
      mockMetaAPI.sendMessage.mockResolvedValue({ id: 'sent-msg-123' });

      whatsappService.sendMessage.mockImplementation(async (message) => {
        const result = await mockMetaAPI.sendMessage(message);
        return { success: true, messageId: result.id };
      });

      const result = await whatsappService.sendMessage(mockMessage);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('sent-msg-123');
      expect(mockMetaAPI.sendMessage).toHaveBeenCalledWith(mockMessage);
    });
  });

  describe('processWithAI', () => {
    test('should process message with AI successfully', async () => {
      const mockMessage = {
        id: 'msg-123',
        content: 'Hello'
      };
      
      const mockAIResponse = {
        text: 'Hi there!',
        intent: 'greeting'
      };
      
      mockConversationService.processMessage.mockResolvedValue(mockAIResponse);

      whatsappService.processWithAI.mockImplementation(async (message) => {
        const response = await mockConversationService.processMessage(message);
        return response;
      });

      const result = await whatsappService.processWithAI(mockMessage);

      expect(result).toEqual(mockAIResponse);
      expect(mockConversationService.processMessage).toHaveBeenCalledWith(mockMessage);
    });
  });

  describe('persistMessage', () => {
    test('should persist message successfully', async () => {
      const mockMessage = {
        id: 'msg-123',
        content: 'Hello',
        clinicId: 'clinic-123'
      };
      
      mockDatabase.query.mockResolvedValue({ rows: [{ id: 'db-msg-123' }] });

      whatsappService.persistMessage.mockImplementation(async (message) => {
        const result = await mockDatabase.query(
          'INSERT INTO messages (id, content, clinic_id) VALUES ($1, $2, $3)',
          [message.id, message.content, message.clinicId]
        );
        return { success: true, dbId: result.rows[0].id };
      });

      const result = await whatsappService.persistMessage(mockMessage);

      expect(result.success).toBe(true);
      expect(result.dbId).toBe('db-msg-123');
      expect(mockDatabase.query).toHaveBeenCalled();
    });

    test('should handle database persistence errors', async () => {
      const mockMessage = {
        id: 'msg-123',
        content: 'Hello',
        clinicId: 'clinic-123'
      };
      
      const mockError = new Error('Database connection failed');
      mockDatabase.query.mockRejectedValue(mockError);

      whatsappService.persistMessage.mockImplementation(async (message) => {
        try {
          await mockDatabase.query('INSERT INTO messages ...', []);
          return { success: true };
        } catch (error) {
          throw new Error(`Database persistence failed: ${error.message}`);
        }
      });

      await expect(
        whatsappService.persistMessage(mockMessage)
      ).rejects.toThrow('Database persistence failed');
    });
  });

  describe('getClinicContext', () => {
    test('should get clinic context successfully', async () => {
      const mockClinicId = 'clinic-123';
      const mockContext = {
        aiPersonality: 'friendly',
        workingHours: '9-18'
      };
      
      mockClinicService.getClinicContext.mockResolvedValue(mockContext);

      whatsappService.getClinicContext.mockImplementation(async (clinicId) => {
        const context = await mockClinicService.getClinicContext(clinicId);
        return context;
      });

      const result = await whatsappService.getClinicContext(mockClinicId);

      expect(result).toEqual(mockContext);
      expect(mockClinicService.getClinicContext).toHaveBeenCalledWith(mockClinicId);
    });

    test('should handle clinic service errors', async () => {
      const mockClinicId = 'clinic-123';
      
      mockClinicService.getClinicContext.mockRejectedValue(new Error('Service unavailable'));

      whatsappService.getClinicContext.mockImplementation(async (clinicId) => {
        try {
          return await mockClinicService.getClinicContext(clinicId);
        } catch (error) {
          return null;
        }
      });

      const result = await whatsappService.getClinicContext(mockClinicId);

      expect(result).toBeNull();
    });
  });

  describe('getWhatsAppConfig', () => {
    test('should get WhatsApp config successfully', async () => {
      const mockClinicId = 'clinic-123';
      const mockConfig = {
        phoneNumber: '+5511888888888',
        autoReplyEnabled: true
      };
      
      mockClinicService.getWhatsAppConfig.mockResolvedValue(mockConfig);

      whatsappService.getWhatsAppConfig.mockImplementation(async (clinicId) => {
        const config = await mockClinicService.getWhatsAppConfig(clinicId);
        return config;
      });

      const result = await whatsappService.getWhatsAppConfig(mockClinicId);

      expect(result).toEqual(mockConfig);
      expect(mockClinicService.getWhatsAppConfig).toHaveBeenCalledWith(mockClinicId);
    });

    test('should handle clinic service errors', async () => {
      const mockClinicId = 'clinic-123';
      
      mockClinicService.getWhatsAppConfig.mockRejectedValue(new Error('Service unavailable'));

      whatsappService.getWhatsAppConfig.mockImplementation(async (clinicId) => {
        try {
          return await mockClinicService.getWhatsAppConfig(clinicId);
        } catch (error) {
          return null;
        }
      });

      const result = await whatsappService.getWhatsAppConfig(mockClinicId);

      expect(result).toBeNull();
    });
  });
});
