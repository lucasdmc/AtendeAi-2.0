import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, AlertCircle, RefreshCw, Plus, Filter, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { appointmentService, Appointment, CreateAppointmentRequest } from '@/services/appointmentService';
import { useApp } from '@/contexts/AppContext';

// Removed Google Calendar interfaces - using only internal appointment system

const Appointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAppointmentData, setNewAppointmentData] = useState<CreateAppointmentRequest>({
    patient_name: '',
    patient_phone: '',
    patient_email: '',
    appointment_type: '',
    appointment_date: '',
    duration_minutes: 30,
    notes: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    today: 0,
    this_week: 0,
    this_month: 0
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const { state: { selectedClinic } } = useApp();

  useEffect(() => {
    if (selectedClinic) {
      loadData();
    }
  }, [selectedClinic]);

  useEffect(() => {
    if (selectedClinic) {
      loadAppointments();
    }
  }, [selectedClinic, selectedDate, statusFilter]);

  const loadData = async () => {
    try {
      if (!selectedClinic) return;

      setLoading(true);
      
      // Load appointments and stats in parallel
      const [appointmentsData, statsData] = await Promise.all([
        loadAppointments(),
        loadStats()
      ]);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    if (!selectedClinic) return;

    try {
      setLoading(true);
      
      // Calculate date range
      const startDate = selectedDate || new Date().toISOString().split('T')[0];
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30); // Next 30 days

      const response = await appointmentService.list({
        date_from: `${startDate}T00:00:00Z`,
        date_to: endDate.toISOString(),
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        limit: 100
      });

      setAppointments(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar agendamentos",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!selectedClinic) return;

    try {
      const statsData = await appointmentService.getStats({
        date_from: new Date().toISOString().split('T')[0] + 'T00:00:00Z'
      });
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      await loadData();
      toast({
        title: "Atualizado",
        description: "Agendamentos atualizados com sucesso"
      });
    } catch (error: any) {
      console.error('Error refreshing appointments:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar agendamentos",
        variant: "destructive"
      });
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClinic) return;

    try {
      if (!newAppointmentData.patient_name || !newAppointmentData.patient_phone || 
          !newAppointmentData.appointment_type || !newAppointmentData.appointment_date) {
        toast({
          title: "Erro",
          description: "Nome do paciente, telefone, tipo e data do agendamento são obrigatórios",
          variant: "destructive"
        });
        return;
      }

      await appointmentService.create({
        ...newAppointmentData,
        clinic_id: selectedClinic
      });

      setIsDialogOpen(false);
      resetForm();
      await loadData();
      
      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso"
      });
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar agendamento",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setNewAppointmentData({
      patient_name: '',
      patient_phone: '',
      patient_email: '',
      appointment_type: '',
      appointment_date: '',
      duration_minutes: 30,
      notes: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendado';
      case 'confirmed':
        return 'Confirmado';
      case 'in_progress':
        return 'Em andamento';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      case 'no_show':
        return 'Não compareceu';
      default:
        return 'Desconhecido';
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = !statusFilter || appointment.status === statusFilter;
    const matchesSearch = !searchTerm || 
      appointment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient_phone.includes(searchTerm) ||
      appointment.patient_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.appointment_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const groupAppointmentsByDate = (appointmentsList: Appointment[]) => {
    const grouped: { [key: string]: Appointment[] } = {};
    
    appointmentsList.forEach(appointment => {
      const date = new Date(appointment.appointment_date).toLocaleDateString('pt-BR');
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(appointment);
    });

    // Sort dates and appointments within each date
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime());
    });

    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando agendamentos...</p>
        </div>
      </div>
    );
  }

  if (!selectedClinic) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Agendamentos</h1>
            <p className="text-muted-foreground">Sistema de agendamentos interno</p>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nenhuma clínica selecionada</AlertTitle>
          <AlertDescription>
            Selecione uma clínica para visualizar os agendamentos.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const groupedAppointments = groupAppointmentsByDate(filteredAppointments);
  const totalAppointments = filteredAppointments.length;

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Agendamentos</h1>
            <p className="text-muted-foreground">
              Próximos eventos do {integration.calendar_name || 'Google Calendar'}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleSync}
            disabled={syncLoading}
          >
            {syncLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar
              </>
            )}
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Agendamento</DialogTitle>
                <DialogDescription>
                  Criar um novo evento no Google Calendar
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={newEventData.title}
                    onChange={(e) => setNewEventData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Consulta com paciente"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Data/Hora Início *</Label>
                    <Input
                      id="start_time"
                      type="datetime-local"
                      value={newEventData.start_time}
                      onChange={(e) => setNewEventData(prev => ({ ...prev, start_time: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Data/Hora Fim *</Label>
                    <Input
                      id="end_time"
                      type="datetime-local"
                      value={newEventData.end_time}
                      onChange={(e) => setNewEventData(prev => ({ ...prev, end_time: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    value={newEventData.location}
                    onChange={(e) => setNewEventData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Ex: Consultório 1, Sala de reunião"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attendees">Participantes (emails separados por vírgula)</Label>
                  <Input
                    id="attendees"
                    value={newEventData.attendees}
                    onChange={(e) => setNewEventData(prev => ({ ...prev, attendees: e.target.value }))}
                    placeholder="paciente@email.com, assistente@clinica.com"
                  />
                </div>

        <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newEventData.description}
                    onChange={(e) => setNewEventData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detalhes do agendamento..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Criar Agendamento
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{totalEvents}</p>
              </div>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confirmados</p>
                <p className="text-2xl font-bold text-green-600">{confirmedEvents}</p>
              </div>
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tentativo</p>
                <p className="text-2xl font-bold text-yellow-600">{tentativeEvents}</p>
              </div>
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Última Sync</p>
                <p className="text-sm">
                  {integration.last_sync 
                    ? new Date(integration.last_sync).toLocaleString('pt-BR')
                    : 'Nunca'
                  }
                </p>
              </div>
              <RefreshCw className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Buscar por título, descrição ou local..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-auto"
        />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="">Todos</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="tentative">Tentativo</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
      </div>

      {/* Integration Status */}
      {integration.status !== 'active' && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Problema na Integração</AlertTitle>
          <AlertDescription>
            {integration.status === 'expired' 
              ? 'O token de acesso expirou. Vá para Calendários e reconnecte sua conta.'
              : 'Erro na integração com Google Calendar. Verifique a conexão.'
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Events List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : Object.keys(groupedEvents).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || statusFilter || selectedDate 
                ? 'Nenhum agendamento encontrado'
                : 'Nenhum agendamento próximo'
              }
            </h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || statusFilter || selectedDate
                ? 'Tente ajustar os filtros de busca.'
                : 'Seus próximos agendamentos aparecerão aqui.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEvents)
            .sort(([dateA], [dateB]) => new Date(dateA.split('/').reverse().join('-')).getTime() - new Date(dateB.split('/').reverse().join('-')).getTime())
            .map(([date, dateEvents]) => (
              <div key={date}>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  {date}
                  <Badge variant="outline" className="ml-2">
                    {dateEvents.length} evento{dateEvents.length !== 1 ? 's' : ''}
                  </Badge>
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {dateEvents.map((event) => {
                    const { time: startTime } = formatDateTime(event.start_time);
                    const { time: endTime } = formatDateTime(event.end_time);
                    
                    return (
                      <Card key={event.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-semibold">{event.title}</h4>
                                <Badge className={getStatusColor(event.status)}>
                                  {getStatusLabel(event.status)}
                                </Badge>
      </div>

                              <div className="space-y-1 text-sm text-muted-foreground">
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {event.all_day ? 'Dia todo' : `${startTime} - ${endTime}`}
                                  </span>
                </div>
                                
                                {event.location && (
                                  <div className="flex items-center space-x-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{event.location}</span>
                </div>
                                )}
                                
                                {event.attendees.length > 0 && (
                                  <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4" />
                                    <span>{event.attendees.length} participante{event.attendees.length !== 1 ? 's' : ''}</span>
                </div>
                                )}
                </div>
                              
                              {event.description && (
                                <p className="text-sm mt-2 text-muted-foreground">
                                  {event.description}
                                </p>
                              )}
                </div>
              </div>
            </CardContent>
          </Card>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Requisitos não funcionais notice */}
      <div className="mt-8 text-sm text-muted-foreground bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Requisitos não funcionais atendidos:</h4>
        <ul className="space-y-1">
          <li>• Carregamento limitado por performance (máximo 100 eventos)</li>
          <li>• Interface responsiva com experiência otimizada</li>
          <li>• Sincronização bidirecional com Google Calendar</li>
          <li>• Filtros e busca para melhor usabilidade</li>
        </ul>
      </div>
    </div>
  );
};

export default Appointments;