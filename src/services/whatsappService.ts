// =====================================================
// SERVIÇO DE INTEGRAÇÃO WHATSAPP - ATENDEAÍ 2.0
// =====================================================

import { supabase } from '@/integrations/supabase/client';

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  from: string;
  to: string;
  message_type: 'text' | 'image' | 'document' | 'audio' | 'video';
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  is_from_customer: boolean;
}

export interface WhatsAppConversation {
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

export interface SendMessageData {
  conversation_id: string;
  content: string;
  message_type?: 'text' | 'image' | 'document' | 'audio' | 'video';
}

export interface ConversationStatus {
  conversation_id: string;
  is_bot_active: boolean;
  bot_config?: {
    auto_reply: boolean;
    welcome_message?: string;
    business_hours: {
      start: string;
      end: string;
      timezone: string;
    };
  };
}

class WhatsAppService {
  private readonly WHATSAPP_SERVICE_URL = 'http://localhost:3007/api/v1';

  // Obter conversas da clínica
  async getConversations(clinicId: string, limit: number = 50, offset: number = 0): Promise<WhatsAppConversation[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select(`
          *,
          messages:whatsapp_messages(*)
        `)
        .eq('clinic_id', clinicId)
        .order('last_message_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(`Error fetching conversations: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in getConversations:', error);
      throw error;
    }
  }

  // Obter conversa específica com mensagens
  async getConversation(conversationId: string): Promise<WhatsAppConversation | null> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select(`
          *,
          messages:whatsapp_messages(*)
        `)
        .eq('id', conversationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw new Error(`Error fetching conversation: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in getConversation:', error);
      throw error;
    }
  }

  // Enviar mensagem via WhatsApp Service
  async sendMessage(messageData: SendMessageData): Promise<WhatsAppMessage> {
    try {
      const response = await fetch(`${this.WHATSAPP_SERVICE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp Service error: ${errorData.error || response.statusText}`);
      }

      const message = await response.json();
      
      // Salvar mensagem no banco local
      await this.saveMessageLocally(message);

      return message;
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  // Salvar mensagem localmente
  private async saveMessageLocally(message: WhatsAppMessage): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_messages')
        .upsert({
          id: message.id,
          conversation_id: message.conversation_id,
          from: message.from,
          to: message.to,
          message_type: message.message_type,
          content: message.content,
          timestamp: message.timestamp,
          status: message.status,
          is_from_customer: message.is_from_customer
        });

      if (error) {
        console.error('Error saving message locally:', error);
      }
    } catch (error) {
      console.error('Error in saveMessageLocally:', error);
    }
  }

  // Obter status da conversa (bot ativo/inativo)
  async getConversationStatus(conversationId: string): Promise<ConversationStatus | null> {
    try {
      const response = await fetch(`${this.WHATSAPP_SERVICE_URL}/conversations/${conversationId}/status`);
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`WhatsApp Service error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getConversationStatus:', error);
      throw error;
    }
  }

  // Ativar/desativar bot para conversa
  async toggleBot(conversationId: string, activate: boolean): Promise<void> {
    try {
      const response = await fetch(`${this.WHATSAPP_SERVICE_URL}/conversations/${conversationId}/bot`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: activate
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp Service error: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error in toggleBot:', error);
      throw error;
    }
  }

  // Assumir conversa (desativar bot)
  async takeOverConversation(conversationId: string): Promise<void> {
    return this.toggleBot(conversationId, false);
  }

  // Liberar conversa (reativar bot)
  async releaseConversation(conversationId: string): Promise<void> {
    return this.toggleBot(conversationId, true);
  }

  // Marcar mensagem como lida
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const response = await fetch(`${this.WHATSAPP_SERVICE_URL}/messages/${messageId}/read`, {
        method: 'PUT',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp Service error: ${errorData.error || response.statusText}`);
      }

      // Atualizar status local
      await this.updateMessageStatusLocally(messageId, 'read');
    } catch (error) {
      console.error('Error in markMessageAsRead:', error);
      throw error;
    }
  }

  // Atualizar status da mensagem localmente
  private async updateMessageStatusLocally(messageId: string, status: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_messages')
        .update({ status })
        .eq('id', messageId);

      if (error) {
        console.error('Error updating message status locally:', error);
      }
    } catch (error) {
      console.error('Error in updateMessageStatusLocally:', error);
    }
  }

  // Obter estatísticas da clínica
  async getClinicStats(clinicId: string): Promise<{
    total_conversations: number;
    active_conversations: number;
    total_messages: number;
    unread_messages: number;
  }> {
    try {
      // Estatísticas de conversas
      const { data: conversations, error: convError } = await supabase
        .from('whatsapp_conversations')
        .select('id, status')
        .eq('clinic_id', clinicId);

      if (convError) {
        throw new Error(`Error fetching conversations: ${convError.message}`);
      }

      // Estatísticas de mensagens
      const { data: messages, error: msgError } = await supabase
        .from('whatsapp_messages')
        .select('id, status, is_from_customer')
        .eq('clinic_id', clinicId);

      if (msgError) {
        throw new Error(`Error fetching messages: ${msgError.message}`);
      }

      const total_conversations = conversations?.length || 0;
      const active_conversations = conversations?.filter(c => c.status === 'active').length || 0;
      const total_messages = messages?.length || 0;
      const unread_messages = messages?.filter(m => 
        !m.is_from_customer && m.status === 'delivered'
      ).length || 0;

      return {
        total_conversations,
        active_conversations,
        total_messages,
        unread_messages
      };
    } catch (error) {
      console.error('Error in getClinicStats:', error);
      throw error;
    }
  }

  // Pesquisar conversas
  async searchConversations(clinicId: string, query: string): Promise<WhatsAppConversation[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select(`
          *,
          messages:whatsapp_messages(*)
        `)
        .eq('clinic_id', clinicId)
        .or(`customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%`)
        .order('last_message_at', { ascending: false });

      if (error) {
        throw new Error(`Error searching conversations: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchConversations:', error);
      throw error;
    }
  }

  // Fechar conversa
  async closeConversation(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update({ 
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        throw new Error(`Error closing conversation: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in closeConversation:', error);
      throw error;
    }
  }

  // Arquivar conversa
  async archiveConversation(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_conversations')
        .update({ 
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        throw new Error(`Error archiving conversation: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in archiveConversation:', error);
      throw error;
    }
  }
}

// Instância singleton
export const whatsappService = new WhatsAppService();
export default whatsappService;
