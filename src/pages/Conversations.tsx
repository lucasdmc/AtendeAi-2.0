import { useState } from "react"
import { MessageSquare, Clock, User, Building2, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  id: string
  sender: "user" | "bot"
  content: string
  timestamp: string
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
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    customerName: "Ana Silva",
    customerPhone: "+55 11 99999-9999",
    clinic: "Clínica São José",
    status: "active",
    lastMessage: "Gostaria de agendar uma consulta com cardiologista",
    lastActivity: "2024-01-20 14:30",
    messageCount: 5,
    messages: [
      {
        id: "1",
        sender: "user",
        content: "Olá, gostaria de agendar uma consulta",
        timestamp: "14:25"
      },
      {
        id: "2", 
        sender: "bot",
        content: "Olá! Posso te ajudar com o agendamento. Qual especialidade você precisa?",
        timestamp: "14:25"
      },
      {
        id: "3",
        sender: "user",
        content: "Preciso de um cardiologista",
        timestamp: "14:28"
      },
      {
        id: "4",
        sender: "bot",
        content: "Perfeito! Temos horários disponíveis com Dr. João. Qual sua preferência de dia?",
        timestamp: "14:28"
      },
      {
        id: "5",
        sender: "user",
        content: "Gostaria de agendar uma consulta com cardiologista",
        timestamp: "14:30"
      }
    ]
  },
  {
    id: "2",
    customerName: "Carlos Santos",
    customerPhone: "+55 11 88888-8888", 
    clinic: "Centro Médico Saúde+",
    status: "pending",
    lastMessage: "Qual o valor da consulta?",
    lastActivity: "2024-01-20 13:15",
    messageCount: 3,
    messages: [
      {
        id: "1",
        sender: "user",
        content: "Boa tarde!",
        timestamp: "13:10"
      },
      {
        id: "2",
        sender: "bot", 
        content: "Boa tarde! Como posso te ajudar?",
        timestamp: "13:10"
      },
      {
        id: "3",
        sender: "user",
        content: "Qual o valor da consulta?",
        timestamp: "13:15"
      }
    ]
  },
  {
    id: "3",
    customerName: "Maria Oliveira",
    customerPhone: "+55 11 77777-7777",
    clinic: "Clínica São José",
    status: "closed",
    lastMessage: "Obrigada! Até mais.",
    lastActivity: "2024-01-19 16:45", 
    messageCount: 8,
    messages: []
  }
]

export default function Conversations() {
  const [conversations] = useState<Conversation[]>(mockConversations)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [clinicFilter, setClinicFilter] = useState("all")
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      active: "Ativa",
      closed: "Finalizada",
      pending: "Pendente"
    }
    return statuses[status] || status
  }

  const getStatusVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      closed: "secondary", 
      pending: "outline"
    }
    return variants[status] || "default"
  }

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = conversation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conversation.customerPhone.includes(searchTerm)
    const matchesStatus = statusFilter === "all" || conversation.status === statusFilter
    const matchesClinic = clinicFilter === "all" || conversation.clinic === clinicFilter
    
    return matchesSearch && matchesStatus && matchesClinic
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Conversas</h2>
        <p className="text-muted-foreground">
          Acompanhe as conversas do atendente virtual com os pacientes
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              className="pl-9"
              placeholder="Nome ou telefone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativa</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="closed">Finalizada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="clinic">Clínica</Label>
          <Select value={clinicFilter} onValueChange={setClinicFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as clínicas</SelectItem>
              <SelectItem value="Clínica São José">Clínica São José</SelectItem>
              <SelectItem value="Centro Médico Saúde+">Centro Médico Saúde+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredConversations.map((conversation) => (
          <Card key={conversation.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>{conversation.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusVariant(conversation.status)}>
                    {getStatusLabel(conversation.status)}
                  </Badge>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button 
                        className="text-sm text-primary hover:underline"
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        Ver conversa
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          {selectedConversation?.customerName}
                          <span className="text-sm font-normal text-muted-foreground">
                            ({selectedConversation?.customerPhone})
                          </span>
                        </DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="h-96 w-full pr-4">
                        <div className="space-y-4">
                          {selectedConversation?.messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] px-3 py-2 rounded-lg ${
                                  message.sender === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-foreground'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {message.timestamp}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardTitle>
              <CardDescription className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  <span>{conversation.clinic}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{conversation.customerPhone}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs">{conversation.messageCount} mensagens</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-foreground">
                  <strong>Última mensagem:</strong> {conversation.lastMessage}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {new Date(conversation.lastActivity).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredConversations.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhuma conversa encontrada com os filtros selecionados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}