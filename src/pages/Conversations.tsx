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
  Paperclip
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import conversationService from "@/services/conversationService"

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

const mockConversations: Conversation[] = [
  {
    id: "1",
    customerName: "Ana Silva",
    customerPhone: "+55 11 99999-9999",
    clinic: "CardioPrime - Blumenau",
    status: "active",
    lastMessage: "Gostaria de agendar uma consulta com cardiologista",
    lastActivity: "2024-01-20 14:30",
    messageCount: 5,
    unreadCount: 2,
    isManualMode: false,
    messages: [
      {
        id: "1",
        sender: "user",
        content: "Olá, gostaria de agendar uma consulta",
        timestamp: "14:25",
        status: "read"
      },
      {
        id: "2", 
        sender: "bot",
        content: "Olá! Posso te ajudar com o agendamento. Qual especialidade você precisa?",
        timestamp: "14:25",
        status: "delivered"
      },
      {
        id: "3",
        sender: "user",
        content: "Preciso de um cardiologista",
        timestamp: "14:28",
        status: "read"
      },
      {
        id: "4",
        sender: "bot",
        content: "Perfeito! Temos horários disponíveis com Dr. Roberto Silva. Qual sua preferência de dia e horário?",
        timestamp: "14:28",
        status: "delivered"
      },
      {
        id: "5",
        sender: "user",
        content: "Gostaria de agendar uma consulta com cardiologista para a próxima semana",
        timestamp: "14:30",
        status: "sent"
      }
    ]
  },
  {
    id: "2",
    customerName: "Carlos Santos",
    customerPhone: "+55 47 88888-8888", 
    clinic: "CardioPrime - Blumenau",
    status: "pending",
    lastMessage: "Qual o valor da consulta?",
    lastActivity: "2024-01-20 13:15",
    messageCount: 3,
    unreadCount: 1,
    isManualMode: false,
    messages: [
      {
        id: "1",
        sender: "user",
        content: "Boa tarde!",
        timestamp: "13:10",
        status: "read"
      },
      {
        id: "2",
        sender: "bot", 
        content: "Boa tarde! Sou o Cardio, assistente virtual da CardioPrime. Como posso cuidar da sua saúde cardiovascular hoje?",
        timestamp: "13:10",
        status: "delivered"
      },
      {
        id: "3",
        sender: "user",
        content: "Qual o valor da consulta cardiológica?",
        timestamp: "13:15",
        status: "sent"
      }
    ]
  },
  {
    id: "3",
    customerName: "Maria Oliveira",
    customerPhone: "+55 47 77777-7777",
    clinic: "CardioPrime - Blumenau",
    status: "closed",
    lastMessage: "Obrigada! Até mais.",
    lastActivity: "2024-01-19 16:45", 
    messageCount: 8,
    isManualMode: false,
    messages: [
      {
        id: "1",
        sender: "user",
        content: "Olá, preciso fazer um ecocardiograma",
        timestamp: "16:30",
        status: "read"
      },
      {
        id: "2",
        sender: "bot",
        content: "Olá! Posso te ajudar com o agendamento do ecocardiograma. Você tem alguma preferência de data?",
        timestamp: "16:30",
        status: "read"
      },
      {
        id: "3",
        sender: "user",
        content: "Seria possível para amanhã?",
        timestamp: "16:32",
        status: "read"
      },
      {
        id: "4",
        sender: "bot",
        content: "Deixe me verificar a disponibilidade... Temos um horário às 14:00. Seria adequado para você?",
        timestamp: "16:33",
        status: "read"
      },
      {
        id: "5",
        sender: "user",
        content: "Perfeito! Como faço o agendamento?",
        timestamp: "16:35",
        status: "read"
      },
      {
        id: "6",
        sender: "bot",
        content: "Ótimo! Vou registrar seu agendamento. Preciso de alguns dados: seu nome completo, CPF e se você tem algum convênio médico.",
        timestamp: "16:35",
        status: "read"
      },
      {
        id: "7",
        sender: "user",
        content: "Maria Oliveira, CPF 123.456.789-00, tenho Unimed",
        timestamp: "16:40",
        status: "read"
      },
      {
        id: "8",
        sender: "bot",
        content: "Perfeito! Seu ecocardiograma está agendado para amanhã às 14:00. Você receberá uma confirmação por SMS. Obrigado por escolher a CardioPrime!",
        timestamp: "16:42",
        status: "read"
      },
      {
        id: "9",
        sender: "user",
        content: "Obrigada! Até mais.",
        timestamp: "16:45",
        status: "read"
      }
    ]
  },
  {
    id: "4",
    customerName: "João Pedro",
    customerPhone: "+55 47 66666-6666",
    clinic: "CardioPrime - Blumenau",
    status: "active",
    lastMessage: "Ok, vou aguardar",
    lastActivity: "2024-01-20 15:45",
    messageCount: 4,
    unreadCount: 0,
    isManualMode: true,
    assignedAgent: "João Silva",
    messages: [
      {
        id: "1",
        sender: "user",
        content: "Tenho uma dúvida sobre o resultado do meu cateterismo",
        timestamp: "15:30",
        status: "read"
      },
      {
        id: "2",
        sender: "bot",
        content: "Entendo sua preocupação. Para questões sobre resultados de exames, é importante conversar diretamente com seu cardiologista. Posso agendar uma consulta para você?",
        timestamp: "15:31",
        status: "read"
      },
      {
        id: "3",
        sender: "user",
        content: "Sim, gostaria de agendar com Dr. Roberto Silva",
        timestamp: "15:40",
        status: "read"
      },
      {
        id: "4",
        sender: "bot",
        content: "Ótimo! Vou verificar a agenda do Dr. Roberto Silva e retorno em instantes com as opções de horário.",
        timestamp: "15:41",
        status: "delivered"
      },
      {
        id: "5",
        sender: "user",
        content: "Ok, vou aguardar",
        timestamp: "15:45",
        status: "sent"
      }
    ]
  }
]

export default function Conversations() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // FASE 1: carregar conversas reais (fallback para mock)
  useEffect(() => {
    const load = async () => {
      try {
        const clinicId = import.meta.env.VITE_DEFAULT_CLINIC_ID || "00000000-0000-0000-0000-000000000001";
        const list = await conversationService.listByClinic(clinicId);
        if (list && list.length) {
          const mapped: Conversation[] = list.map((c) => ({
            id: c.id,
            customerName: c.wa_contact_id || "Contato",
            customerPhone: c.wa_contact_id || "",
            clinic: c.clinic_id,
            status: c.status === 'open' ? 'active' : 'closed',
            lastMessage: '',
            lastActivity: c.last_message_at || '',
            messageCount: 0,
            messages: [],
            isManualMode: c.mode === 'off' ? true : false,
          }));
          setConversations(mapped);
        }
      } catch (e) {
        // fallback: manter mocks
      }
    };
    load();
  }, []);

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation?.messages])

  const filteredConversations = conversations.filter(conversation => 
    conversation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversation.customerPhone.includes(searchTerm)
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
      sender: selectedConversation.isManualMode ? "bot" : "bot",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: "sent"
    }

    // otimismo UI
    setConversations(prev => 
      prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, messages: [...conv.messages, newMsg] }
          : conv
      )
    )

    setSelectedConversation(prev => 
      prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
    )

    setNewMessage("")

    // chamada real
    try {
      const clinicId = selectedConversation.clinic || (import.meta.env.VITE_DEFAULT_CLINIC_ID as string);
      await conversationService.processMessage({
        clinic_id: clinicId,
        patient_phone: selectedConversation.customerPhone || "+00000000000",
        message_content: newMsg.content,
      });
    } catch (e) {
      // mantém UI; erros podem ser exibidos depois
    }

    if (!selectedConversation.isManualMode) {
      setTimeout(() => {
        const autoReply: Message = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          content: "Esta é uma resposta automática do assistente virtual.",
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          status: "delivered"
        }

        setConversations(prev => 
          prev.map(conv => 
            conv.id === selectedConversation.id 
              ? { ...conv, messages: [...conv.messages, autoReply] }
              : conv
          )
        )

        setSelectedConversation(prev => 
          prev ? { ...prev, messages: [...prev.messages, autoReply] } : null
        )
      }, 1200)
    }
  }

  const toggleManualMode = async () => {
    if (!selectedConversation) return

    const newManualMode = !selectedConversation.isManualMode
    const agentName = "João Silva"

    // otimismo UI
    setConversations(prev => 
      prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { 
              ...conv, 
              isManualMode: newManualMode,
              assignedAgent: newManualMode ? agentName : undefined
            }
          : conv
      )
    )

    setSelectedConversation(prev => 
      prev ? { 
        ...prev, 
        isManualMode: newManualMode,
        assignedAgent: newManualMode ? agentName : undefined
      } : null
    )

    try {
      if (newManualMode) {
        await conversationService.transitionToHuman(selectedConversation.id, "00000000-0000-0000-0000-0000000000AA");
      } else {
        await conversationService.transitionToBot(selectedConversation.id);
      }
    } catch (e) {
      // ignore por ora; manteremos otimista
    }

    const systemMessage: Message = {
      id: Date.now().toString(),
      sender: "bot",
      content: newManualMode 
        ? `🧑‍💼 Atendente ${agentName} assumiu esta conversa.`
        : `🤖 Conversa retornada para atendimento automático.`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: "delivered"
    }

    setTimeout(() => {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, messages: [...conv.messages, systemMessage] }
            : conv
        )
      )

      setSelectedConversation(prev => 
        prev ? { ...prev, messages: [...prev.messages, systemMessage] } : null
      )
    }, 300)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
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
            {filteredConversations.map((conversation) => (
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
                    {getInitials(conversation.customerName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm truncate">{conversation.customerName}</h3>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(conversation.lastActivity.split(' ')[1] || '')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate mr-2">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unreadCount && conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant={conversation.status === 'active' ? 'default' : conversation.status === 'pending' ? 'outline' : 'secondary'}
                      className="text-xs"
                    >
                      {conversation.status === 'active' ? 'Ativa' : conversation.status === 'pending' ? 'Pendente' : 'Finalizada'}
                    </Badge>
                    {conversation.isManualMode && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        <Users className="h-3 w-3 mr-1" />
                        Manual
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
                    {getInitials(selectedConversation.customerName)}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{selectedConversation.customerName}</h3>
                    {selectedConversation.isManualMode ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Users className="h-3 w-3 mr-1" />
                        {selectedConversation.assignedAgent}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <Bot className="h-3 w-3 mr-1" />
                        Automático
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedConversation.customerPhone}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant={selectedConversation.isManualMode ? "default" : "outline"}
                  size="sm"
                  onClick={toggleManualMode}
                >
                  {selectedConversation.isManualMode ? (
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
                {selectedConversation.messages.map((message) => (
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
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input de mensagem */}
            <div className="p-4 border-t">
              {selectedConversation.isManualMode ? (
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