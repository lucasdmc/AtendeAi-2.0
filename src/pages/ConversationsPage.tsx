import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, PhoneCall, Tag, MoreVertical, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarContent, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { conversationService } from '@/services/conversationService';

interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'customer' | 'bot' | 'human';
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'video' | 'document';
  timestamp: string;
  whatsapp_message_id?: string;
}

interface Conversation {
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

interface ConversationTag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

const ConversationsPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tags, setTags] = useState<ConversationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [simulationMode, setSimulationMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
    loadTags();
    // Check simulation mode status
    checkSimulationMode();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await conversationService.list({
        status: statusFilter || undefined,
        conversation_type: typeFilter || undefined,
        search: searchTerm || undefined
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar conversas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setMessageLoading(true);
      const response = await conversationService.getMessages(conversationId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar mensagens",
        variant: "destructive"
      });
    } finally {
      setMessageLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const response = await conversationService.getTags();
      setTags(response);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const checkSimulationMode = async () => {
    try {
      // This would come from clinic configuration
      setSimulationMode(false); // Default to false for now
    } catch (error) {
      console.error('Error checking simulation mode:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) {
      return;
    }

    try {
      const message = await conversationService.sendMessage(selectedConversation.id, {
        content: newMessage.trim(),
        message_type: 'text'
      });

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Update conversation in list
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, last_message: message, updated_at: message.timestamp }
            : conv
        )
      );

      if (simulationMode) {
        toast({
          title: "Modo Simulação",
          description: "Mensagem simulada (não enviada ao WhatsApp)",
          variant: "default"
        });
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao enviar mensagem",
        variant: "destructive"
      });
    }
  };

  const handleBotControl = async (conversationId: string, botActive: boolean) => {
    try {
      const updatedConversation = await conversationService.updateBotControl(conversationId, botActive);
      
      setSelectedConversation(updatedConversation);
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? updatedConversation : conv
        )
      );

      toast({
        title: botActive ? "Chatbot Ativado" : "Conversa Assumida",
        description: botActive 
          ? "Chatbot retomou o controle da conversa"
          : "Você assumiu o controle da conversa"
      });
    } catch (error: any) {
      console.error('Error updating bot control:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao controlar chatbot",
        variant: "destructive"
      });
    }
  };

  const handleTagConversation = async (conversationId: string, tagIds: string[]) => {
    try {
      const updatedConversation = await conversationService.updateTags(conversationId, tagIds);
      
      setSelectedConversation(updatedConversation);
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId ? updatedConversation : conv
        )
      );

      toast({
        title: "Etiquetas Atualizadas",
        description: "Etiquetas da conversa foram atualizadas"
      });
    } catch (error: any) {
      console.error('Error updating tags:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao atualizar etiquetas",
        variant: "destructive"
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getMessageIcon = (senderType: string) => {
    switch (senderType) {
      case 'bot':
        return <Bot className="h-4 w-4" />;
      case 'human':
        return <User className="h-4 w-4" />;
      case 'customer':
        return <PhoneCall className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getMessageBubbleClass = (senderType: string) => {
    switch (senderType) {
      case 'customer':
        return 'bg-blue-500 text-white ml-auto max-w-[70%]';
      case 'bot':
        return 'bg-gray-200 text-gray-900 mr-auto max-w-[70%]';
      case 'human':
        return 'bg-green-500 text-white mr-auto max-w-[70%]';
      default:
        return 'bg-gray-200 text-gray-900 mr-auto max-w-[70%]';
    }
  };

  const formatPhone = (phone: string) => {
    // Format +5511999999999 to (11) 99999-9999
    const numbers = phone.replace(/\D/g, '');
    if (numbers.length >= 11) {
      return `(${numbers.substring(2, 4)}) ${numbers.substring(4, 9)}-${numbers.substring(9)}`;
    }
    return phone;
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = formatPhone(conv.customer_phone).includes(searchTerm) ||
                         conv.customer_phone.includes(searchTerm);
    const matchesStatus = !statusFilter || conv.status === statusFilter;
    const matchesType = !typeFilter || conv.conversation_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getTagColor = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    return tag?.color || '#gray';
  };

  const getTagName = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId);
    return tag?.name || 'Tag';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] bg-background">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold mb-4">Conversas</h2>
          
          {/* Simulation Mode Indicator */}
          {simulationMode && (
            <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span>Modo Simulação Ativo</span>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="paused">Pausado</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="chatbot">Chatbot</SelectItem>
                  <SelectItem value="human">Humano</SelectItem>
                  <SelectItem value="mixed">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium truncate">
                          {formatPhone(conversation.customer_phone)}
                        </span>
                        {conversation.unread_count && conversation.unread_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={conversation.bot_active ? 'default' : 'secondary'} className="text-xs">
                          {conversation.bot_active ? 'Bot' : 'Humano'}
                        </Badge>
                        
                        <Badge variant="outline" className="text-xs">
                          {conversation.status === 'active' ? 'Ativo' : 
                           conversation.status === 'paused' ? 'Pausado' : 'Fechado'}
                        </Badge>
                      </div>

                      {conversation.tags && conversation.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {conversation.tags.slice(0, 2).map((tagId) => (
                            <Badge 
                              key={tagId} 
                              variant="outline" 
                              className="text-xs"
                              style={{ borderColor: getTagColor(tagId) }}
                            >
                              {getTagName(tagId)}
                            </Badge>
                          ))}
                          {conversation.tags.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{conversation.tags.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                      {conversation.last_message && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {conversation.last_message.content}
                        </p>
                      )}
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(conversation.updated_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback>
                    <PhoneCall className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">
                    {formatPhone(selectedConversation.customer_phone)}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.conversation_type} • {selectedConversation.status}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Bot Control */}
                <div className="flex items-center space-x-2">
                  <Label htmlFor="bot-control" className="text-sm">
                    {selectedConversation.bot_active ? 'Chatbot Ativo' : 'Atendimento Humano'}
                  </Label>
                  <Switch
                    id="bot-control"
                    checked={selectedConversation.bot_active}
                    onCheckedChange={(checked) => handleBotControl(selectedConversation.id, checked)}
                  />
                </div>

                {/* More Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Tag className="h-4 w-4 mr-2" />
                      Gerenciar Etiquetas
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Arquivar Conversa
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Exportar Conversa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              {messageLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`p-3 rounded-lg ${getMessageBubbleClass(message.sender_type)}`}>
                        <div className="flex items-center space-x-2 mb-1">
                          {getMessageIcon(message.sender_type)}
                          <span className="text-xs opacity-70">
                            {message.sender_type === 'customer' ? 'Cliente' :
                             message.sender_type === 'bot' ? 'Chatbot' : 'Atendente'}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1"
                  disabled={selectedConversation.bot_active}
                />
                <Button type="submit" disabled={!newMessage.trim() || selectedConversation.bot_active}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              
              {selectedConversation.bot_active && (
                <p className="text-xs text-muted-foreground mt-2">
                  Desative o chatbot para enviar mensagens manualmente
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <PhoneCall className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Selecione uma conversa</h3>
              <p className="text-muted-foreground">
                Escolha uma conversa na lista para começar a atender
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsPage;
