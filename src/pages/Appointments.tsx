import { useState } from "react"
import { Calendar, Clock, User, Phone, MapPin, Filter, Search, Plus, Loader2, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppointments } from "@/hooks/useApi"
import { useClinic as useClinicContext } from "@/contexts/ClinicContext"

interface Appointment {
  id: string
  clinic_id: string
  customer_info: any
  google_event_id?: string
  google_calendar_id?: string
  appointment_type: string
  datetime: string
  duration: number
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'
  priority: number
  confirmation_sent: boolean
  confirmation_received: boolean
  confirmation_sent_at?: string
  confirmation_received_at?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Mock data removed - now using real API data

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
}

const statusLabels = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Realizado",
  cancelled: "Cancelado"
}

export default function Appointments() {
  const { selectedClinic } = useClinicContext()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")

  // API hooks
  const { data: appointmentsData, loading: appointmentsLoading, error: appointmentsError } = useAppointments(selectedClinic?.id)
  const appointments = appointmentsData?.data || []

  const filteredAppointments = appointments.filter(appointment => {
    const customerName = appointment.customer_info?.name || 'Cliente'
    const customerPhone = appointment.customer_info?.phone || ''
    const appointmentDate = new Date(appointment.datetime).toISOString().split('T')[0]
    
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customerPhone.includes(searchTerm)
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter
    const matchesDate = dateFilter === "all" || appointmentDate === dateFilter
    
    return matchesSearch && matchesStatus && matchesDate
  })

  // Loading state
  if (appointmentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando agendamentos...</span>
      </div>
    )
  }

  // Error state
  if (appointmentsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <span className="ml-2 text-destructive">Erro ao carregar agendamentos: {appointmentsError}</span>
      </div>
    )
  }

  // No clinic selected
  if (!selectedClinic) {
    return (
      <div className="flex items-center justify-center h-64">
        <Calendar className="h-8 w-8 text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Nenhuma clínica selecionada</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os agendamentos da clínica
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por paciente ou profissional..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="scheduled">Agendado</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="completed">Realizado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="2024-03-15">Hoje</SelectItem>
              <SelectItem value="2024-03-16">Amanhã</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
          <Card key={appointment.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold text-lg">{appointment.customer_info?.name || 'Cliente'}</h3>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{appointment.customer_info?.phone || 'Telefone não informado'}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColors[appointment.status]}>
                      {statusLabels[appointment.status]}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(appointment.datetime).toLocaleDateString('pt-BR')}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(appointment.datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ({appointment.duration}min)</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.customer_info?.location || 'Local não informado'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{appointment.customer_info?.professional || 'Profissional não informado'}</span>
                      <Badge variant="secondary">{appointment.appointment_type}</Badge>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        Reagendar
                      </Button>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        <strong>Observações:</strong> {appointment.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum agendamento encontrado</h3>
              <p className="text-muted-foreground text-center">
                Não há agendamentos que correspondam aos filtros aplicados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  )
}