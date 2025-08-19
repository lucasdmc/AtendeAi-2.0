import { useState } from "react"
import { Calendar, Clock, User, Building2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Appointment {
  id: string
  patientName: string
  clinic: string
  date: string
  time: string
  status: "scheduled" | "confirmed" | "cancelled" | "completed"
  specialty: string
}

const mockAppointments: Appointment[] = [
  {
    id: "1",
    patientName: "Ana Silva",
    clinic: "Clínica São José",
    date: "2024-01-20",
    time: "14:00",
    status: "confirmed",
    specialty: "Cardiologia"
  },
  {
    id: "2",
    patientName: "Carlos Santos",
    clinic: "Centro Médico Saúde+",
    date: "2024-01-20",
    time: "15:30",
    status: "scheduled",
    specialty: "Dermatologia"
  },
  {
    id: "3",
    patientName: "Maria Oliveira",
    clinic: "Clínica São José",
    date: "2024-01-21",
    time: "09:00",
    status: "completed",
    specialty: "Pediatria"
  }
]

export default function Appointments() {
  const [appointments] = useState<Appointment[]>(mockAppointments)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const getStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      scheduled: "Agendado",
      confirmed: "Confirmado", 
      cancelled: "Cancelado",
      completed: "Realizado"
    }
    return statuses[status] || status
  }

  const getStatusVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      scheduled: "outline",
      confirmed: "default",
      cancelled: "destructive", 
      completed: "secondary"
    }
    return variants[status] || "default"
  }

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            placeholder="Nome do paciente ou especialidade"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="scheduled">Agendado</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
              <SelectItem value="completed">Realizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredAppointments.map((appointment) => (
          <Card key={appointment.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span>{appointment.patientName}</span>
                </div>
                <Badge variant={getStatusVariant(appointment.status)}>
                  {getStatusLabel(appointment.status)}
                </Badge>
              </CardTitle>
              <CardDescription className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  <span>{appointment.clinic}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{appointment.specialty}</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(appointment.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{appointment.time}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredAppointments.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum agendamento encontrado com os filtros selecionados.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}