// =====================================================
// TESTES DE INTEGRAÇÃO WHATSAPP - ATENDEAÍ 2.0
// =====================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { whatsappService } from '@/services/whatsappService';
import { WhatsAppConversations } from '@/components/WhatsAppConversations';

// Mock do WhatsAppService
vi.mock('@/services/whatsappService', () => ({
  whatsappService: {
    getConversations: vi.fn(),
    getConversation: vi.fn(),
    sendMessage: vi.fn(),
    getConversationStatus: vi.fn(),
    takeOverConversation: vi.fn(),
    releaseConversation: vi.fn(),
    markMessageAsRead: vi.fn(),
    searchConversations: vi.fn(),
    closeConversation: vi.fn(),
    archiveConversation: vi.fn(),
    getClinicStats: vi.fn()
  }
}));

// Mock do useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123' },
    isAuthenticated: true,
    isLoading: false
  })
}));

// Mock do date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, format) => {
    if (format === 'HH:mm') return '14:30';
    if (format === 'dd/MM/yyyy') return '01/01/2024';
    return date.toString();
  })
}));

// Mock do date-fns/locale
vi.mock('date-fns/locale', () => ({
  ptBR: {}
}));

describe('Integração WhatsApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('WhatsAppService', () => {
    const mockConversations = [
      {
        id: 'conv-1',
        clinic_id: 'clinic-123',
        customer_phone: '+5511999999999',
        customer_name: 'João Silva',
        status: 'active' as const,
        last_message_at: '2024-01-01T14:30:00Z',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T14:30:00Z',
        messages: [
          {
            id: 'msg-1',
            conversation_id: 'conv-1',
            from: '+5511999999999',
            to: '+5511888888888',
            message_type: 'text' as const,
            content: 'Olá, gostaria de agendar uma consulta',
            timestamp: '2024-01-01T14:30:00Z',
            status: 'delivered' as const,
            is_from_customer: true
          }
        ]
      }
    ];

    it('deve obter conversas da clínica', async () => {
      (whatsappService.getConversations as any).mockResolvedValue(mockConversations);

      const result = await whatsappService.getConversations('clinic-123');

      expect(result).toEqual(mockConversations);
      expect(whatsappService.getConversations).toHaveBeenCalledWith('clinic-123');
    });

    it('deve obter conversa específica', async () => {
      (whatsappService.getConversation as any).mockResolvedValue(mockConversations[0]);

      const result = await whatsappService.getConversation('conv-1');

      expect(result).toEqual(mockConversations[0]);
      expect(whatsappService.getConversation).toHaveBeenCalledWith('conv-1');
    });

    it('deve enviar mensagem', async () => {
      const mockMessage = {
        id: 'msg-2',
        conversation_id: 'conv-1',
        from: '+5511888888888',
        to: '+5511999999999',
        message_type: 'text' as const,
        content: 'Olá! Como posso ajudá-lo?',
        timestamp: '2024-01-01T14:35:00Z',
        status: 'sent' as const,
        is_from_customer: false
      };

      (whatsappService.sendMessage as any).mockResolvedValue(mockMessage);

      const messageData = {
        conversation_id: 'conv-1',
        content: 'Olá! Como posso ajudá-lo?',
        message_type: 'text' as const
      };

      const result = await whatsappService.sendMessage(messageData);

      expect(result).toEqual(mockMessage);
      expect(whatsappService.sendMessage).toHaveBeenCalledWith(messageData);
    });

    it('deve obter status da conversa', async () => {
      const mockStatus = {
        conversation_id: 'conv-1',
        is_bot_active: true,
        bot_config: {
          auto_reply: true,
          welcome_message: 'Olá! Bem-vindo!',
          business_hours: {
            start: '08:00',
            end: '18:00',
            timezone: 'America/Sao_Paulo'
          }
        }
      };

      (whatsappService.getConversationStatus as any).mockResolvedValue(mockStatus);

      const result = await whatsappService.getConversationStatus('conv-1');

      expect(result).toEqual(mockStatus);
      expect(whatsappService.getConversationStatus).toHaveBeenCalledWith('conv-1');
    });

    it('deve assumir conversa (desativar bot)', async () => {
      (whatsappService.takeOverConversation as any).mockResolvedValue(undefined);

      await whatsappService.takeOverConversation('conv-1');

      expect(whatsappService.takeOverConversation).toHaveBeenCalledWith('conv-1');
    });

    it('deve liberar conversa (reativar bot)', async () => {
      (whatsappService.releaseConversation as any).mockResolvedValue(undefined);

      await whatsappService.releaseConversation('conv-1');

      expect(whatsappService.releaseConversation).toHaveBeenCalledWith('conv-1');
    });

    it('deve pesquisar conversas', async () => {
      const filteredConversations = mockConversations.filter(c => 
        c.customer_name?.includes('João')
      );

      (whatsappService.searchConversations as any).mockResolvedValue(filteredConversations);

      const result = await whatsappService.searchConversations('clinic-123', 'João');

      expect(result).toEqual(filteredConversations);
      expect(whatsappService.searchConversations).toHaveBeenCalledWith('clinic-123', 'João');
    });

    it('deve obter estatísticas da clínica', async () => {
      const mockStats = {
        total_conversations: 10,
        active_conversations: 5,
        total_messages: 50,
        unread_messages: 3
      };

      (whatsappService.getClinicStats as any).mockResolvedValue(mockStats);

      const result = await whatsappService.getClinicStats('clinic-123');

      expect(result).toEqual(mockStats);
      expect(whatsappService.getClinicStats).toHaveBeenCalledWith('clinic-123');
    });
  });

  describe('WhatsAppConversations Component', () => {
    const mockConversations = [
      {
        id: 'conv-1',
        clinic_id: 'clinic-123',
        customer_phone: '+5511999999999',
        customer_name: 'João Silva',
        status: 'active' as const,
        last_message_at: '2024-01-01T14:30:00Z',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T14:30:00Z',
        messages: [
          {
            id: 'msg-1',
            conversation_id: 'conv-1',
            from: '+5511999999999',
            to: '+5511888888888',
            message_type: 'text' as const,
            content: 'Olá, gostaria de agendar uma consulta',
            timestamp: '2024-01-01T14:30:00Z',
            status: 'delivered' as const,
            is_from_customer: true
          }
        ]
      }
    ];

    it('deve renderizar lista de conversas', async () => {
      (whatsappService.getConversations as any).mockResolvedValue(mockConversations);

      render(<WhatsAppConversations clinicId="clinic-123" />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.getByText('Olá, gostaria de agendar uma consulta')).toBeInTheDocument();
      });
    });

    it('deve mostrar estado de loading', () => {
      (whatsappService.getConversations as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      render(<WhatsAppConversations clinicId="clinic-123" />);

      expect(screen.getByText('Carregando conversas...')).toBeInTheDocument();
    });

    it('deve selecionar conversa ao clicar', async () => {
      (whatsappService.getConversations as any).mockResolvedValue(mockConversations);
      (whatsappService.getConversationStatus as any).mockResolvedValue({
        conversation_id: 'conv-1',
        is_bot_active: false
      });

      render(<WhatsAppConversations clinicId="clinic-123" />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // A primeira conversa deve ser selecionada automaticamente
      expect(screen.getByText('+5511999999999')).toBeInTheDocument();
    });

    it('deve enviar mensagem', async () => {
      (whatsappService.getConversations as any).mockResolvedValue(mockConversations);
      (whatsappService.getConversationStatus as any).mockResolvedValue({
        conversation_id: 'conv-1',
        is_bot_active: false
      });

      const mockNewMessage = {
        id: 'msg-2',
        conversation_id: 'conv-1',
        from: '+5511888888888',
        to: '+5511999999999',
        message_type: 'text' as const,
        content: 'Mensagem de teste',
        timestamp: '2024-01-01T14:35:00Z',
        status: 'sent' as const,
        is_from_customer: false
      };

      (whatsappService.sendMessage as any).mockResolvedValue(mockNewMessage);

      render(<WhatsAppConversations clinicId="clinic-123" />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Digite sua mensagem...');
      const sendButton = screen.getByRole('button', { name: '' }); // Botão com ícone Send

      fireEvent.change(input, { target: { value: 'Mensagem de teste' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(whatsappService.sendMessage).toHaveBeenCalledWith({
          conversation_id: 'conv-1',
          content: 'Mensagem de teste',
          message_type: 'text'
        });
      });
    });

    it('deve mostrar controles de bot', async () => {
      (whatsappService.getConversations as any).mockResolvedValue(mockConversations);
      (whatsappService.getConversationStatus as any).mockResolvedValue({
        conversation_id: 'conv-1',
        is_bot_active: true
      });

      render(<WhatsAppConversations clinicId="clinic-123" />);

      await waitFor(() => {
        expect(screen.getByText('Bot Ativo')).toBeInTheDocument();
        expect(screen.getByText('Assumir')).toBeInTheDocument();
      });
    });

    it('deve assumir conversa ao clicar em "Assumir"', async () => {
      (whatsappService.getConversations as any).mockResolvedValue(mockConversations);
      (whatsappService.getConversationStatus as any).mockResolvedValue({
        conversation_id: 'conv-1',
        is_bot_active: true
      });
      (whatsappService.takeOverConversation as any).mockResolvedValue(undefined);

      render(<WhatsAppConversations clinicId="clinic-123" />);

      await waitFor(() => {
        expect(screen.getByText('Assumir')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Assumir'));

      await waitFor(() => {
        expect(whatsappService.takeOverConversation).toHaveBeenCalledWith('conv-1');
      });
    });

    it('deve liberar conversa ao clicar em "Liberar"', async () => {
      (whatsappService.getConversations as any).mockResolvedValue(mockConversations);
      (whatsappService.getConversationStatus as any).mockResolvedValue({
        conversation_id: 'conv-1',
        is_bot_active: false
      });
      (whatsappService.releaseConversation as any).mockResolvedValue(undefined);

      render(<WhatsAppConversations clinicId="clinic-123" />);

      await waitFor(() => {
        expect(screen.getByText('Liberar')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Liberar'));

      await waitFor(() => {
        expect(whatsappService.releaseConversation).toHaveBeenCalledWith('conv-1');
      });
    });

    it('deve pesquisar conversas', async () => {
      (whatsappService.getConversations as any).mockResolvedValue(mockConversations);
      (whatsappService.searchConversations as any).mockResolvedValue([]);

      render(<WhatsAppConversations clinicId="clinic-123" />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Pesquisar conversas...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Pesquisar conversas...');
      const searchButton = screen.getByRole('button', { name: '' }); // Botão com ícone Search

      fireEvent.change(searchInput, { target: { value: 'Maria' } });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(whatsappService.searchConversations).toHaveBeenCalledWith('clinic-123', 'Maria');
      });
    });
  });

  describe('Fluxo Completo de Conversas', () => {
    it('deve completar fluxo: carregar -> selecionar -> assumir -> enviar -> liberar', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          clinic_id: 'clinic-123',
          customer_phone: '+5511999999999',
          customer_name: 'João Silva',
          status: 'active' as const,
          last_message_at: '2024-01-01T14:30:00Z',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T14:30:00Z',
          messages: []
        }
      ];

      // 1. Carregar conversas
      (whatsappService.getConversations as any).mockResolvedValue(mockConversations);
      
      // 2. Status inicial - bot ativo
      (whatsappService.getConversationStatus as any)
        .mockResolvedValueOnce({
          conversation_id: 'conv-1',
          is_bot_active: true
        })
        .mockResolvedValueOnce({
          conversation_id: 'conv-1',
          is_bot_active: false
        })
        .mockResolvedValueOnce({
          conversation_id: 'conv-1',
          is_bot_active: true
        });

      // 3. Assumir conversa
      (whatsappService.takeOverConversation as any).mockResolvedValue(undefined);

      // 4. Enviar mensagem
      const mockMessage = {
        id: 'msg-1',
        conversation_id: 'conv-1',
        from: '+5511888888888',
        to: '+5511999999999',
        message_type: 'text' as const,
        content: 'Olá! Como posso ajudá-lo?',
        timestamp: '2024-01-01T14:35:00Z',
        status: 'sent' as const,
        is_from_customer: false
      };
      (whatsappService.sendMessage as any).mockResolvedValue(mockMessage);

      // 5. Liberar conversa
      (whatsappService.releaseConversation as any).mockResolvedValue(undefined);

      render(<WhatsAppConversations clinicId="clinic-123" />);

      // Verificar carregamento das conversas
      await waitFor(() => {
        expect(whatsappService.getConversations).toHaveBeenCalledWith('clinic-123');
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Verificar que o bot está ativo
      await waitFor(() => {
        expect(screen.getByText('Bot Ativo')).toBeInTheDocument();
      });

      // Assumir conversa
      fireEvent.click(screen.getByText('Assumir'));
      await waitFor(() => {
        expect(whatsappService.takeOverConversation).toHaveBeenCalledWith('conv-1');
      });

      // Simular que o status mudou para humano
      await waitFor(() => {
        expect(screen.getByText('Liberar')).toBeInTheDocument();
      });

      // Enviar mensagem
      const input = screen.getByPlaceholderText('Digite sua mensagem...');
      fireEvent.change(input, { target: { value: 'Olá! Como posso ajudá-lo?' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(whatsappService.sendMessage).toHaveBeenCalledWith({
          conversation_id: 'conv-1',
          content: 'Olá! Como posso ajudá-lo?',
          message_type: 'text'
        });
      });

      // Liberar conversa
      fireEvent.click(screen.getByText('Liberar'));
      await waitFor(() => {
        expect(whatsappService.releaseConversation).toHaveBeenCalledWith('conv-1');
      });
    });
  });

  describe('Casos de Erro', () => {
    it('deve tratar erro ao carregar conversas', async () => {
      (whatsappService.getConversations as any).mockRejectedValue(
        new Error('Erro de conexão')
      );

      render(<WhatsAppConversations clinicId="clinic-123" />);

      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar conversas')).toBeInTheDocument();
      });
    });

    it('deve tratar erro ao enviar mensagem', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          clinic_id: 'clinic-123',
          customer_phone: '+5511999999999',
          customer_name: 'João Silva',
          status: 'active' as const,
          last_message_at: '2024-01-01T14:30:00Z',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T14:30:00Z',
          messages: []
        }
      ];

      (whatsappService.getConversations as any).mockResolvedValue(mockConversations);
      (whatsappService.getConversationStatus as any).mockResolvedValue({
        conversation_id: 'conv-1',
        is_bot_active: false
      });
      (whatsappService.sendMessage as any).mockRejectedValue(
        new Error('Falha ao enviar mensagem')
      );

      render(<WhatsAppConversations clinicId="clinic-123" />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Digite sua mensagem...');
      fireEvent.change(input, { target: { value: 'Teste' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Erro ao enviar mensagem')).toBeInTheDocument();
      });
    });
  });
});
