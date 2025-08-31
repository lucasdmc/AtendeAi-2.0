import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'bot' | 'human';
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document';
  timestamp: string;
  whatsapp_message_id?: string;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  clinic_id: string;
  customer_phone: string;
  conversation_type: 'chatbot' | 'human' | 'mixed';
  status: 'active' | 'paused' | 'closed';
  bot_active: boolean;
  assigned_user_id?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  last_message?: Message;
  unread_count?: number;
}

export interface ConversationTag {
  id: string;
  name: string;
  color: string;
  description?: string;
  clinic_id: string;
}

export interface SendMessageRequest {
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document';
  metadata?: Record<string, any>;
}

export interface ListConversationsResponse {
  data: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ListMessagesResponse {
  data: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

class ConversationService {
  private readonly conversationsTable = 'conversations';
  private readonly messagesTable = 'messages';
  private readonly tagsTable = 'conversation_tags';

  async list(params?: {
    page?: number;
    limit?: number;
    status?: string;
    conversation_type?: string;
    assigned_user_id?: string;
    tags?: string[];
    search?: string;
  }): Promise<ListConversationsResponse> {
    try {
      const { page = 1, limit = 20, status, conversation_type, assigned_user_id, tags, search } = params || {};
      const offset = (page - 1) * limit;

      let query = supabase
        .from(this.conversationsTable)
        .select(`
          *,
          last_message:messages(
            id,
            content,
            sender_type,
            message_type,
            timestamp
          )
        `, { count: 'exact' });

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }

      if (conversation_type) {
        query = query.eq('conversation_type', conversation_type);
      }

      if (assigned_user_id) {
        query = query.eq('assigned_user_id', assigned_user_id);
      }

      if (search) {
        query = query.ilike('customer_phone', `%${search}%`);
      }

      if (tags && tags.length > 0) {
        query = query.overlaps('tags', tags);
      }

      // Apply pagination
      query = query
        .range(offset, offset + limit - 1)
        .order('updated_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Error fetching conversations: ${error.message}`);
      }

      const total = count || 0;
      const pages = Math.ceil(total / limit);

      // Get unread count for each conversation
      const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conversation) => {
          const unreadCount = await this.getUnreadCount(conversation.id);
          return {
            ...conversation,
            unread_count: unreadCount
          };
        })
      );

      return {
        data: conversationsWithUnread,
        pagination: {
          page,
          limit,
          total,
          pages,
          has_next: page < pages,
          has_prev: page > 1
        }
      };
    } catch (error) {
      console.error('Error in conversationService.list:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<Conversation> {
    try {
      const { data, error } = await supabase
        .from(this.conversationsTable)
        .select(`
          *,
          last_message:messages(
            id,
            content,
            sender_type,
            message_type,
            timestamp
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Conversa não encontrada');
        }
        throw new Error(`Error fetching conversation: ${error.message}`);
      }

      const unreadCount = await this.getUnreadCount(id);

      return {
        ...data,
        unread_count: unreadCount
      };
    } catch (error) {
      console.error('Error in conversationService.getById:', error);
      throw error;
    }
  }

  async getMessages(conversationId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<ListMessagesResponse> {
    try {
      const { page = 1, limit = 50 } = params || {};
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from(this.messagesTable)
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversationId)
        .range(offset, offset + limit - 1)
        .order('timestamp', { ascending: true });

      if (error) {
        throw new Error(`Error fetching messages: ${error.message}`);
      }

      const total = count || 0;
      const pages = Math.ceil(total / limit);

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total,
          pages,
          has_next: page < pages,
          has_prev: page > 1
        }
      };
    } catch (error) {
      console.error('Error in conversationService.getMessages:', error);
      throw error;
    }
  }

  async sendMessage(conversationId: string, messageData: SendMessageRequest): Promise<Message> {
    try {
      // Validate required fields
      if (!messageData.content || !messageData.message_type) {
        throw new Error('Conteúdo e tipo da mensagem são obrigatórios');
      }

      const newMessage = {
        conversation_id: conversationId,
        sender_type: 'human' as const,
        content: messageData.content.trim(),
        message_type: messageData.message_type,
        metadata: messageData.metadata || {},
        timestamp: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(this.messagesTable)
        .insert([newMessage])
        .select()
        .single();

      if (error) {
        throw new Error(`Error sending message: ${error.message}`);
      }

      // Update conversation timestamp
      await this.updateConversationTimestamp(conversationId);

      return data;
    } catch (error) {
      console.error('Error in conversationService.sendMessage:', error);
      throw error;
    }
  }

  async updateBotControl(conversationId: string, botActive: boolean): Promise<Conversation> {
    try {
      const updateData = {
        bot_active: botActive,
        conversation_type: botActive ? 'chatbot' as const : 'human' as const,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(this.conversationsTable)
        .update(updateData)
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Conversa não encontrada');
        }
        throw new Error(`Error updating bot control: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in conversationService.updateBotControl:', error);
      throw error;
    }
  }

  async updateTags(conversationId: string, tagIds: string[]): Promise<Conversation> {
    try {
      const { data, error } = await supabase
        .from(this.conversationsTable)
        .update({
          tags: tagIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Conversa não encontrada');
        }
        throw new Error(`Error updating tags: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in conversationService.updateTags:', error);
      throw error;
    }
  }

  async assignUser(conversationId: string, userId?: string): Promise<Conversation> {
    try {
      const { data, error } = await supabase
        .from(this.conversationsTable)
        .update({
          assigned_user_id: userId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Conversa não encontrada');
        }
        throw new Error(`Error assigning user: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in conversationService.assignUser:', error);
      throw error;
    }
  }

  async updateStatus(conversationId: string, status: 'active' | 'paused' | 'closed'): Promise<Conversation> {
    try {
      const { data, error } = await supabase
        .from(this.conversationsTable)
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Conversa não encontrada');
        }
        throw new Error(`Error updating status: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in conversationService.updateStatus:', error);
      throw error;
    }
  }

  async getTags(clinicId?: string): Promise<ConversationTag[]> {
    try {
      let query = supabase
        .from(this.tagsTable)
        .select('*')
        .order('name', { ascending: true });

      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Error fetching tags: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in conversationService.getTags:', error);
      throw error;
    }
  }

  async createTag(tagData: {
    name: string;
    color: string;
    description?: string;
    clinic_id: string;
  }): Promise<ConversationTag> {
    try {
      const newTag = {
        name: tagData.name.trim(),
        color: tagData.color,
        description: tagData.description?.trim() || null,
        clinic_id: tagData.clinic_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(this.tagsTable)
        .insert([newTag])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Já existe uma etiqueta com este nome');
        }
        throw new Error(`Error creating tag: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in conversationService.createTag:', error);
      throw error;
    }
  }

  async getConversationStats(clinicId?: string): Promise<{
    total: number;
    active: number;
    bot_active: number;
    human_active: number;
    unassigned: number;
  }> {
    try {
      let query = supabase
        .from(this.conversationsTable)
        .select('status, bot_active, assigned_user_id', { count: 'exact' });

      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Error fetching conversation stats: ${error.message}`);
      }

      const total = count || 0;
      const conversations = data || [];

      const stats = {
        total,
        active: conversations.filter(c => c.status === 'active').length,
        bot_active: conversations.filter(c => c.bot_active).length,
        human_active: conversations.filter(c => !c.bot_active && c.status === 'active').length,
        unassigned: conversations.filter(c => !c.assigned_user_id && c.status === 'active').length
      };

      return stats;
    } catch (error) {
      console.error('Error in conversationService.getConversationStats:', error);
      throw error;
    }
  }

  private async getUnreadCount(conversationId: string): Promise<number> {
    try {
      // This would typically track read status per user
      // For now, return 0 as placeholder
      return 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  private async updateConversationTimestamp(conversationId: string): Promise<void> {
    try {
      await supabase
        .from(this.conversationsTable)
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error updating conversation timestamp:', error);
    }
  }

  async exportConversation(conversationId: string): Promise<{
    conversation: Conversation;
    messages: Message[];
  }> {
    try {
      const [conversation, messagesResponse] = await Promise.all([
        this.getById(conversationId),
        this.getMessages(conversationId, { limit: 1000 })
      ]);

      return {
        conversation,
        messages: messagesResponse.data
      };
    } catch (error) {
      console.error('Error in conversationService.exportConversation:', error);
      throw error;
    }
  }

  async searchMessages(query: string, conversationId?: string): Promise<Message[]> {
    try {
      let searchQuery = supabase
        .from(this.messagesTable)
        .select('*')
        .ilike('content', `%${query}%`)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (conversationId) {
        searchQuery = searchQuery.eq('conversation_id', conversationId);
      }

      const { data, error } = await searchQuery;

      if (error) {
        throw new Error(`Error searching messages: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in conversationService.searchMessages:', error);
      throw error;
    }
  }
}

export const conversationService = new ConversationService();
