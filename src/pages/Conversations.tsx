import { useState, useRef, useEffect } from "react"
import { 
  MessageSquare, 
  Clock, 
  User, 
  Building2, 
  Search, 
  Send, 
  Phone, 
  MoreVertical,
  Check,
  CheckCheck,
  Smile,
  UserCheck,
  Bot,
  Users,
  Paperclip,
  Loader2,
  AlertTriangle
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useConversations, useActiveConversations, useConversationHistory } from "@/hooks/useApi"
import { useClinic as useClinicContext } from "@/contexts/ClinicContext"

interface Message {
  id: string
  sender: "user" | "bot"
  content: string
  timestamp: string
  status?: "sent" | "delivered" | "read"
}

interface Conversation {
  id: string
  customerName: string
  customerPhone: string
  clinic: string
  status: "active" | "closed" | "pending"
  lastMessage: string
  lastActivity: string
  messageCount: number
  messages: Message[]
  avatar?: string
  unreadCount?: number
  isManualMode?: boolean
  assignedAgent?: string
}

// Mock data removed - now using real API data

export default function Conversations() {
  const { selectedClinic } = useClinicContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])

  // Hook para carregar mensagens da conversa selecionada
  const { data: messagesData, loading: messagesLoading } = useConversationHistory(
    selectedClinic?.id || '',
    selectedConversation?.customer_phone || '',
    50,
    0
  )

  // API hooks
  const { data: conversationsData, loading: conversationsLoading, error: conversationsError, refetch: refetchConversations } = useConversations(selectedClinic?.id || '')
  const { data: activeConversationsData, loading: activeLoading } = useActiveConversations(selectedClinic?.id || '')

  const conversations = conversationsData?.data || []
  const activeConversations = activeConversationsData?.data || []

  // Auto-refresh conversations every 30 seconds
  useEffect(() => {
    if (!selectedClinic?.id) return;
    
    const interval = setInterval(() => {
      refetchConversations();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedClinic?.id, refetchConversations]);

  // Carregar mensagens quando uma conversa é selecionada
  useEffect(() => {
    if (messagesData?.data?.messages) {
      const mappedMessages = messagesData.data.messages.map((msg: any) => ({
        id: msg.id,
        sender: msg.sender_type === 'customer' ? 'user' : 'bot',
        content: msg.content,
        timestamp: new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: msg.whatsapp_message_id ? 'delivered' : 'sent'
      }));
      setConversationMessages(mappedMessages);
    } else {
      setConversationMessages([]);
    }
  }, [messagesData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversationMessages])

  const filteredConversations = conversations.filter(conversation => 
    conversation.customer_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.customer_phone?.includes(searchTerm) ||
    conversation.id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const formatTime = (timestamp: string) => {
    return timestamp
  }

  const getMessageStatus = (status?: string) => {
    switch (status) {
      case "sent":
        return <Check className="h-3 w-3 text-muted-foreground" />
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />
      case "read":
        return <CheckCheck className="h-3 w-3 text-primary" />
      default:
        return null
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: selectedConversation.assigned_user_id ? "bot" : "bot", // Em modo manual, o atendente responde
      content: newMessage,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: "sent"
    }

    try {
      // Enviar mensagem via API real
      const { conversationApi } = await import('../services/api');
      
      await conversationApi.processMessage({
        clinic_id: selectedClinic?.id || '',
        patient_phone: selectedConversation.customer_phone,
        message_content: newMessage,
        message_type: 'text'
      });

      setConversationMessages(prev => [...prev, newMsg])

      setNewMessage("")

      // Simular resposta automática apenas se não estiver em modo manual
      if (!selectedConversation.assigned_user_id) {
        setTimeout(() => {
          const autoReply: Message = {
            id: (Date.now() + 1).toString(),
            sender: "bot",
            content: "Esta é uma resposta automática do assistente virtual. Para atendimento personalizado, um de nossos atendentes pode assumir esta conversa.",
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            status: "delivered"
          }

          setConversationMessages(prev => [...prev, autoReply])
        }, 2000)
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  }

  const toggleManualMode = async () => {
    if (!selectedConversation) return

    const newManualMode = !selectedConversation.assigned_user_id
    const agentName = "Atendente" // Nome do atendente logado (seria obtido do contexto de autenticação)

    try {
      const { conversationApi } = await import('../services/api');
      
      if (newManualMode) {
        // Assumir conversa
        await conversationApi.transitionToHuman(
          selectedConversation.id, 
          'current-user-id', 
          'Atendente assumiu a conversa manualmente'
        );
      } else {
        // Retornar para bot
        await conversationApi.transitionToBot(
          selectedConversation.id, 
          'Conversa retornada para atendimento automático'
        );
      }

      setSelectedConversation(prev => 
        prev ? { 
          ...prev, 
          assigned_user_id: newManualMode ? 'current-user-id' : undefined
        } : null
      )

      // Adicionar mensagem do sistema informando a mudança
      const systemMessage: Message = {
        id: Date.now().toString(),
        sender: "bot",
        content: newManualMode 
          ? `🧑‍💼 Atendente ${agentName} assumiu esta conversa. Agora você será atendido por uma pessoa.`
          : `🤖 Conversa retornada para atendimento automático.`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: "delivered"
      }

      setConversationMessages(prev => [...prev, systemMessage])
    } catch (error) {
      console.error('Erro ao alterar modo da conversa:', error);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Loading state
  if (conversationsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando conversas...</span>
      </div>
    )
  }

  // Error state
  if (conversationsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <span className="ml-2 text-destructive">Erro ao carregar conversas: {conversationsError}</span>
      </div>
    )
  }

  // No clinic selected
  if (!selectedClinic) {
    return (
      <div className="flex items-center justify-center h-64">
        <Building2 className="h-8 w-8 text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Nenhuma clínica selecionada</span>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-background">
      {/* Sidebar com lista de conversas */}
      <div className="w-80 border-r flex flex-col">
        {/* Header da sidebar */}
        <div className="p-4 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de conversas */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`flex items-center p-3 hover:bg-muted/50 cursor-pointer rounded-lg mb-1 ${
                    selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={conversation.avatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(conversation.customer_phone || 'Cliente')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm truncate">{conversation.customer_phone || 'Cliente'}</h3>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(new Date(conversation.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate mr-2">
                        {conversation.status === 'active' ? 'Conversa ativa' : 'Conversa finalizada'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={conversation.status === 'active' ? 'default' : conversation.status === 'paused' ? 'outline' : 'secondary'}
                        className="text-xs"
                      >
                        {conversation.status === 'active' ? 'Ativa' : conversation.status === 'paused' ? 'Pausada' : 'Finalizada'}
                      </Badge>
                      {conversation.assigned_user_id && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          <Users className="h-3 w-3 mr-1" />
                          Manual
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Nenhuma conversa encontrada
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Área principal do chat */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header do chat */}
            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(selectedConversation.customer_phone || 'Cliente')}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{selectedConversation.customer_phone || 'Cliente'}</h3>
                    {selectedConversation.assigned_user_id ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Users className="h-3 w-3 mr-1" />
                        Manual
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Bot className="h-3 w-3 mr-1" />
                        Automático
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedConversation.customer_phone}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant={selectedConversation.assigned_user_id ? "default" : "outline"}
                  size="sm"
                  onClick={toggleManualMode}
                >
                  {selectedConversation.assigned_user_id ? (
                    <>
                      <Bot className="h-4 w-4 mr-2" />
                      Voltar para Automático
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Assumir Conversa
                    </>
                  )}
                </Button>
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Área de mensagens */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Carregando mensagens...</span>
                  </div>
                ) : conversationMessages && conversationMessages.length > 0 ? (
                  conversationMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex items-end max-w-[70%] gap-2">
                        {message.sender === 'bot' && (
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              AI
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div
                          className={`px-3 py-2 rounded-lg ${
                            message.sender === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted text-foreground rounded-bl-sm'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${
                            message.sender === 'user' ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className="text-xs opacity-70">
                              {formatTime(message.timestamp)}
                            </span>
                            {message.sender === 'user' && getMessageStatus(message.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      Nenhuma mensagem nesta conversa
                    </p>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      As mensagens serão carregadas quando disponíveis
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input de mensagem */}
            <div className="p-4 border-t">
              {selectedConversation.assigned_user_id ? (
                <div className="flex items-end gap-2">
                  <Button variant="ghost" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Anexar arquivo">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Digite sua mensagem como atendente..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pr-12"
                    />
                  </div>
                  
                  <Button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Bot className="h-5 w-5" />
                    <span className="text-sm">
                      Conversa em modo automático - o bot está respondendo
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={toggleManualMode}
                    className="mt-3"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Assumir Conversa
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Estado vazio */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-muted-foreground">
                Escolha uma conversa na lista para visualizar e responder as mensagens
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}