// =====================================================
// TESTES DE CONTRATO DE API - ATENDEAÍ 2.0
// =====================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Tipos esperados das APIs
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface Clinic {
  id: string;
  name: string;
  phone: string;
  webhook_url: string;
  whatsapp_number: string;
  config: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

interface User {
  id: string;
  email: string;
  role: 'admin_lify' | 'admin_clinic' | 'attendant';
  clinic_id: string | null;
  created_at?: string;
  updated_at?: string;
}

interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  from: string;
  to: string;
  message_type: 'text' | 'image' | 'document' | 'audio';
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  is_from_customer: boolean;
}

interface Conversation {
  id: string;
  clinic_id: string;
  customer_phone: string;
  customer_name?: string;
  status: 'active' | 'closed' | 'archived';
  last_message_at: string;
  created_at: string;
  updated_at: string;
  messages: WhatsAppMessage[];
}

// Mock dos serviços para teste de contrato
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Contratos de API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Auth Service API (Porta 3001)', () => {
    const AUTH_BASE_URL = 'http://localhost:3001';

    it('POST /auth/login deve retornar contrato correto', async () => {
      const mockResponse: ApiResponse<{ user: User; tokens: { access: string; refresh: string } }> = {
        success: true,
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            role: 'admin_clinic',
            clinic_id: 'clinic-456'
          },
          tokens: {
            access: 'access-token-123',
            refresh: 'refresh-token-123'
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch(`${AUTH_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      const result = await response.json();

      expect(result).toMatchObject({
        success: expect.any(Boolean),
        data: {
          user: {
            id: expect.any(String),
            email: expect.any(String),
            role: expect.stringMatching(/^(admin_lify|admin_clinic|attendant)$/),
            clinic_id: expect.any(String)
          },
          tokens: {
            access: expect.any(String),
            refresh: expect.any(String)
          }
        }
      });
    });

    it('POST /auth/refresh deve retornar contrato correto', async () => {
      const mockResponse: ApiResponse<{ access_token: string }> = {
        success: true,
        data: {
          access_token: 'new-access-token-123'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch(`${AUTH_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer refresh-token-123'
        }
      });

      const result = await response.json();

      expect(result).toMatchObject({
        success: expect.any(Boolean),
        data: {
          access_token: expect.any(String)
        }
      });
    });

    it('POST /auth/logout deve retornar contrato correto', async () => {
      const mockResponse: ApiResponse<{}> = {
        success: true,
        message: 'Logout realizado com sucesso'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch(`${AUTH_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer access-token-123'
        }
      });

      const result = await response.json();

      expect(result).toMatchObject({
        success: expect.any(Boolean),
        message: expect.any(String)
      });
    });
  });

  describe('Clinic Service API (Porta 3003)', () => {
    const CLINIC_BASE_URL = 'http://localhost:3003';

    it('GET /clinics deve retornar contrato correto', async () => {
      const mockResponse: ApiResponse<Clinic[]> = {
        success: true,
        data: [
          {
            id: 'clinic-1',
            name: 'Clínica A',
            phone: '+5511111111111',
            webhook_url: 'https://api.example.com/webhook1',
            whatsapp_number: '111111111',
            config: {},
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T10:00:00Z'
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch(`${CLINIC_BASE_URL}/clinics`, {
        headers: { 'Authorization': 'Bearer access-token-123' }
      });

      const result = await response.json();

      expect(result).toMatchObject({
        success: expect.any(Boolean),
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            phone: expect.stringMatching(/^\+55\d{10,11}$/),
            webhook_url: expect.stringMatching(/^https?:\/\/.+/),
            whatsapp_number: expect.any(String),
            config: expect.any(Object)
          })
        ])
      });
    });

    it('POST /clinics deve retornar contrato correto', async () => {
      const newClinic: Omit<Clinic, 'id' | 'created_at' | 'updated_at'> = {
        name: 'Nova Clínica',
        phone: '+5511999999999',
        webhook_url: 'https://api.example.com/webhook',
        whatsapp_number: '999999999',
        config: {}
      };

      const mockResponse: ApiResponse<Clinic> = {
        success: true,
        data: {
          id: 'clinic-new',
          ...newClinic,
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch(`${CLINIC_BASE_URL}/clinics`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer access-token-123'
        },
        body: JSON.stringify(newClinic)
      });

      const result = await response.json();

      expect(result).toMatchObject({
        success: expect.any(Boolean),
        data: expect.objectContaining({
          id: expect.any(String),
          name: newClinic.name,
          phone: newClinic.phone,
          webhook_url: newClinic.webhook_url,
          whatsapp_number: newClinic.whatsapp_number,
          config: expect.any(Object),
          created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        })
      });
    });
  });

  describe('User Service API (Porta 3002)', () => {
    const USER_BASE_URL = 'http://localhost:3002';

    it('GET /users/:clinicId deve retornar contrato correto', async () => {
      const mockResponse: ApiResponse<User[]> = {
        success: true,
        data: [
          {
            id: 'user-1',
            email: 'admin@clinic.com',
            role: 'admin_clinic',
            clinic_id: 'clinic-123',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T10:00:00Z'
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch(`${USER_BASE_URL}/users/clinic-123`, {
        headers: { 'Authorization': 'Bearer access-token-123' }
      });

      const result = await response.json();

      expect(result).toMatchObject({
        success: expect.any(Boolean),
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
            role: expect.stringMatching(/^(admin_lify|admin_clinic|attendant)$/),
            clinic_id: expect.any(String)
          })
        ])
      });
    });

    it('POST /users deve retornar contrato correto', async () => {
      const newUser: Omit<User, 'id' | 'created_at' | 'updated_at'> = {
        email: 'newuser@clinic.com',
        role: 'attendant',
        clinic_id: 'clinic-123'
      };

      const mockResponse: ApiResponse<User> = {
        success: true,
        data: {
          id: 'user-new',
          ...newUser,
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch(`${USER_BASE_URL}/users`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer access-token-123'
        },
        body: JSON.stringify({ ...newUser, password: 'password123' })
      });

      const result = await response.json();

      expect(result).toMatchObject({
        success: expect.any(Boolean),
        data: expect.objectContaining({
          id: expect.any(String),
          email: newUser.email,
          role: newUser.role,
          clinic_id: newUser.clinic_id,
          created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        })
      });
    });
  });

  describe('WhatsApp Service API (Porta 3007)', () => {
    const WHATSAPP_BASE_URL = 'http://localhost:3007';

    it('GET /conversations/:clinicId deve retornar contrato correto', async () => {
      const mockResponse: ApiResponse<Conversation[]> = {
        success: true,
        data: [
          {
            id: 'conv-1',
            clinic_id: 'clinic-123',
            customer_phone: '+5511999999999',
            customer_name: 'João Silva',
            status: 'active',
            last_message_at: '2024-01-01T14:30:00Z',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T14:30:00Z',
            messages: [
              {
                id: 'msg-1',
                conversation_id: 'conv-1',
                from: '+5511999999999',
                to: '+5511888888888',
                message_type: 'text',
                content: 'Olá, gostaria de agendar uma consulta',
                timestamp: '2024-01-01T14:30:00Z',
                status: 'delivered',
                is_from_customer: true
              }
            ]
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch(`${WHATSAPP_BASE_URL}/conversations/clinic-123`, {
        headers: { 'Authorization': 'Bearer access-token-123' }
      });

      const result = await response.json();

      expect(result).toMatchObject({
        success: expect.any(Boolean),
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            clinic_id: expect.any(String),
            customer_phone: expect.stringMatching(/^\+55\d{10,11}$/),
            status: expect.stringMatching(/^(active|closed|archived)$/),
            messages: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                conversation_id: expect.any(String),
                from: expect.stringMatching(/^\+55\d{10,11}$/),
                to: expect.stringMatching(/^\+55\d{10,11}$/),
                message_type: expect.stringMatching(/^(text|image|document|audio)$/),
                content: expect.any(String),
                timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
                status: expect.stringMatching(/^(sent|delivered|read|failed)$/),
                is_from_customer: expect.any(Boolean)
              })
            ])
          })
        ])
      });
    });

    it('POST /messages deve retornar contrato correto', async () => {
      const newMessage = {
        conversation_id: 'conv-1',
        content: 'Olá! Como posso ajudá-lo?',
        message_type: 'text' as const
      };

      const mockResponse: ApiResponse<WhatsAppMessage> = {
        success: true,
        data: {
          id: 'msg-new',
          conversation_id: 'conv-1',
          from: '+5511888888888',
          to: '+5511999999999',
          message_type: 'text',
          content: 'Olá! Como posso ajudá-lo?',
          timestamp: '2024-01-01T14:35:00Z',
          status: 'sent',
          is_from_customer: false
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch(`${WHATSAPP_BASE_URL}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer access-token-123'
        },
        body: JSON.stringify(newMessage)
      });

      const result = await response.json();

      expect(result).toMatchObject({
        success: expect.any(Boolean),
        data: expect.objectContaining({
          id: expect.any(String),
          conversation_id: newMessage.conversation_id,
          from: expect.stringMatching(/^\+55\d{10,11}$/),
          to: expect.stringMatching(/^\+55\d{10,11}$/),
          message_type: newMessage.message_type,
          content: newMessage.content,
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          status: expect.stringMatching(/^(sent|delivered|read|failed)$/),
          is_from_customer: expect.any(Boolean)
        })
      });
    });

    it('POST /conversations/:id/takeover deve retornar contrato correto', async () => {
      const mockResponse: ApiResponse<{}> = {
        success: true,
        message: 'Conversa assumida com sucesso'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch(`${WHATSAPP_BASE_URL}/conversations/conv-1/takeover`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer access-token-123' }
      });

      const result = await response.json();

      expect(result).toMatchObject({
        success: expect.any(Boolean),
        message: expect.any(String)
      });
    });

    it('POST /conversations/:id/release deve retornar contrato correto', async () => {
      const mockResponse: ApiResponse<{}> = {
        success: true,
        message: 'Conversa liberada para o bot'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch(`${WHATSAPP_BASE_URL}/conversations/conv-1/release`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer access-token-123' }
      });

      const result = await response.json();

      expect(result).toMatchObject({
        success: expect.any(Boolean),
        message: expect.any(String)
      });
    });
  });

  describe('Google Calendar Service API (Porta 3008)', () => {
    const CALENDAR_BASE_URL = 'http://localhost:3008';

    it('GET /auth/google/url deve retornar contrato correto', async () => {
      const mockResponse: ApiResponse<{ authUrl: string }> = {
        success: true,
        data: {
          authUrl: 'https://accounts.google.com/oauth/authorize?client_id=...'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch(`${CALENDAR_BASE_URL}/auth/google/url`, {
        headers: { 'Authorization': 'Bearer access-token-123' }
      });

      const result = await response.json();

      expect(result).toMatchObject({
        success: expect.any(Boolean),
        data: {
          authUrl: expect.stringMatching(/^https:\/\/accounts\.google\.com\/oauth\/authorize/)
        }
      });
    });

    it('GET /calendar/events deve retornar contrato correto', async () => {
      const mockResponse: ApiResponse<any[]> = {
        success: true,
        data: [
          {
            id: 'event-1',
            summary: 'Consulta com Dr. Silva',
            start: {
              dateTime: '2024-01-02T10:00:00-03:00'
            },
            end: {
              dateTime: '2024-01-02T11:00:00-03:00'
            }
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const response = await fetch(`${CALENDAR_BASE_URL}/calendar/events`, {
        headers: { 'Authorization': 'Bearer access-token-123' }
      });

      const result = await response.json();

      expect(result).toMatchObject({
        success: expect.any(Boolean),
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            summary: expect.any(String),
            start: expect.objectContaining({
              dateTime: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
            }),
            end: expect.objectContaining({
              dateTime: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
            })
          })
        ])
      });
    });
  });

  describe('Error Handling Contracts', () => {
    it('deve retornar contrato de erro padronizado', async () => {
      const mockErrorResponse: ApiResponse<never> = {
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Credenciais inválidas'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockErrorResponse
      });

      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid@email.com',
          password: 'wrongpassword'
        })
      });

      const result = await response.json();

      expect(result).toMatchObject({
        success: false,
        error: expect.any(String),
        message: expect.any(String)
      });
    });

    it('deve retornar contrato de erro de validação', async () => {
      const mockValidationError: ApiResponse<never> = {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Dados inválidos',
        data: {
          fields: {
            email: 'Email é obrigatório',
            password: 'Senha deve ter pelo menos 8 caracteres'
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => mockValidationError
      });

      const response = await fetch('http://localhost:3002/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer access-token-123'
        },
        body: JSON.stringify({
          email: 'invalid-email',
          password: '123'
        })
      });

      const result = await response.json();

      expect(result).toMatchObject({
        success: false,
        error: expect.any(String),
        message: expect.any(String),
        data: expect.objectContaining({
          fields: expect.any(Object)
        })
      });
    });
  });

  describe('Rate Limiting Contracts', () => {
    it('deve retornar contrato de rate limit', async () => {
      const mockRateLimitResponse = {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Muitas requisições. Tente novamente em alguns minutos.',
        retryAfter: 60
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Map([['Retry-After', '60']]),
        json: async () => mockRateLimitResponse
      });

      const response = await fetch('http://localhost:3007/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer access-token-123'
        },
        body: JSON.stringify({
          conversation_id: 'conv-1',
          content: 'Mensagem',
          message_type: 'text'
        })
      });

      const result = await response.json();

      expect(response.status).toBe(429);
      expect(result).toMatchObject({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: expect.any(String),
        retryAfter: expect.any(Number)
      });
    });
  });
});
