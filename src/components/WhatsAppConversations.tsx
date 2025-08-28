// =====================================================
// COMPONENTE DE CONVERSAS WHATSAPP - ATENDEAÍ 2.0
// =====================================================

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { whatsappService, WhatsAppConversation, WhatsAppMessage, ConversationStatus } from '@/services/whatsappService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Send, 
  Search, 
  Phone, 
  User, 
  Bot, 
  MoreVertical,
  Archive,
  Trash2,
  Check,
  CheckCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WhatsAppConversationsProps {
  clinicId: string;
}

export const WhatsAppConversations = ({ clinicId }: WhatsAppConversationsProps) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [conversationStatus, setConversationStatus] = useState<ConversationStatus | null>(null);
  const [isTogglingBot, setIsTogglingBot] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, [clinicId]);

  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom();
      loadConversationStatus();
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom();
    }
  }, [selectedConversation?.messages]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const data = await whatsappService.getConversations(clinicId);
      setConversations(data);
      
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Erro ao carregar conversas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationStatus = async () => {
    if (!selectedConversation) return;
    
    try {
      const status = await whatsappService.getConversationStatus(selectedConversation.id);
      setConversationStatus(status);
    } catch (error) {
      console.error('Error loading conversation status:', error);
      // Não mostrar erro para o usuário, apenas log
    }
  };

  const searchConversations = async () => {
    if (!searchQuery.trim()) {
      await loadConversations();
      return;
    }

    try {
      setIsLoading(true);
      const results = await whatsappService.searchConversations(clinicId, searchQuery);
      setConversations(results);
    } catch (error) {
      console.error('Error searching conversations:', error);
      setError('Erro ao pesquisar conversas');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    try {
      setIsSending(true);
      
      const messageData = {
        conversation_id: selectedConversation.id,
        content: newMessage.trim(),
        message_type: 'text' as const
      };

      const sentMessage = await whatsappService.sendMessage(messageData);
      
      // Atualizar conversa localmente
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, sentMessage],
        last_message_at: sentMessage.timestamp
      } : null);

      // Atualizar lista de conversas
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, last_message_at: sentMessage.timestamp }
          : conv
      ));

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const takeOverConversation = async () => {
    if (!selectedConversation || isTogglingBot) return;
    
    try {
      setIsTogglingBot(true);
      await whatsappService.takeOverConversation(selectedConversation.id);
      await loadConversationStatus(); // Recarregar status
    } catch (error) {
      console.error('Error taking over conversation:', error);
      setError('Erro ao assumir conversa');
    } finally {
      setIsTogglingBot(false);
    }
  };

  const releaseConversation = async () => {
    if (!selectedConversation || isTogglingBot) return;
    
    try {
      setIsTogglingBot(true);
      await whatsappService.releaseConversation(selectedConversation.id);
      await loadConversationStatus(); // Recarregar status
    } catch (error) {
      console.error('Error releasing conversation:', error);
      setError('Erro ao liberar conversa');
    } finally {
      setIsTogglingBot(false);
    }
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'HH:mm', { locale: ptBR });
    } catch {
      return timestamp;
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return timestamp;
    }
  };

  if (isLoading && conversations.length === 0) {
    return (
      <Card className="w-full h-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando conversas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex h-full">
      {/* Lista de conversas */}
      <div className="w-80 border-r bg-muted/30">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Conversas</h2>
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Pesquisar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchConversations()}
            />
            <Button 
              size="sm" 
              onClick={searchConversations}
              disabled={isLoading}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                selectedConversation?.id === conversation.id ? 'bg-muted' : ''
              }`}
              onClick={() => setSelectedConversation(conversation)}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">
                      {conversation.customer_name || conversation.customer_phone}
                    </h3>
                    <Badge variant={conversation.status === 'active' ? 'default' : 'secondary'}>
                      {conversation.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.messages[conversation.messages.length - 1]?.content || 'Nenhuma mensagem'}
                  </p>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(conversation.last_message_at)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Cabeçalho da conversa */}
            <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-semibold">
                      {selectedConversation.customer_name || selectedConversation.customer_phone}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.customer_phone}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Controles de Bot */}
                  {conversationStatus && (
                    <div className="flex items-center gap-2 mr-2">
                      <Badge variant={conversationStatus.is_bot_active ? 'default' : 'secondary'}>
                        <Bot className="h-3 w-3 mr-1" />
                        {conversationStatus.is_bot_active ? 'Bot Ativo' : 'Humano'}
                      </Badge>
                      
                      {conversationStatus.is_bot_active ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={takeOverConversation}
                          disabled={isTogglingBot}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Assumir
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={releaseConversation}
                          disabled={isTogglingBot}
                        >
                          <Bot className="h-4 w-4 mr-2" />
                          Liberar
                        </Button>
                      )}
                    </div>
                  )}
                  
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Ligar
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.is_from_customer ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.is_from_customer
                          ? 'bg-muted'
                          : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-70">
                          {formatTimestamp(message.timestamp)}
                        </span>
                        {!message.is_from_customer && getMessageStatusIcon(message.status)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input de mensagem */}
            <div className="p-4 border-t bg-background">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={isSending}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim() || isSending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma conversa selecionada</h3>
              <p className="text-muted-foreground">
                Selecione uma conversa da lista para começar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Mensagens de erro */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default WhatsAppConversations;
