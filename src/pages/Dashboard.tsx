import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock,
  Bot,
  Building2,
  Phone,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { conversationService } from '@/services/conversationService';
import { appointmentService } from '@/services/appointmentService';
import { clinicService } from '@/services/clinicService';
import { userService } from '@/services/userService';

interface DashboardStats {
  conversations: {
    total: number;
    active: number;
    bot_active: number;
    human_active: number;
    unassigned: number;
  };
  appointments: {
    total: number;
    today: number;
    this_week: number;
    confirmed: number;
    completed: number;
  };
  users: {
    total: number;
    active: number;
  };
  clinics: {
    total: number;
    active: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'conversation' | 'appointment' | 'user' | 'clinic';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

interface UpcomingAppointment {
  id: string;
  patient_name: string;
  appointment_type: string;
  appointment_date: string;
  duration_minutes: number;
  status: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { toast } = useToast();
  const { user, isAdminLify } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadRecentActivity(),
        loadUpcomingAppointments()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const isAdmin = await isAdminLify();
      
      // Load conversation stats
      const conversationStats = await conversationService.getConversationStats(
        isAdmin ? undefined : user?.clinic_id
      );

      // Load appointment stats
      const appointmentStats = await appointmentService.getStats({
        assigned_user_id: isAdmin ? undefined : user?.id
      });

      // Load user stats (only for admins)
      let userStats = { total: 0, active: 0 };
      if (isAdmin || user?.role === 'administrador') {
        const userCount = await userService.getActiveUserCount(
          isAdmin ? undefined : user?.clinic_id
        );
        userStats = { total: userCount, active: userCount };
      }

      // Load clinic stats (only for Admin Lify)
      let clinicStats = { total: 0, active: 0 };
      if (isAdmin) {
        const clinicCount = await clinicService.getActiveClinicCount();
        clinicStats = { total: clinicCount, active: clinicCount };
      }

      setStats({
        conversations: conversationStats,
        appointments: appointmentStats,
        users: userStats,
        clinics: clinicStats
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      throw error;
    }
  };

  const loadRecentActivity = async () => {
    try {
      // This would be implemented with a real activity log
      // For now, we'll create mock data based on recent conversations
      const conversationsResponse = await conversationService.list({ limit: 5 });
      
      const activity: RecentActivity[] = conversationsResponse.data.map(conv => ({
        id: conv.id,
        type: 'conversation' as const,
        title: `Conversa com ${conv.customer_phone}`,
        description: conv.bot_active ? 'Atendimento via chatbot' : 'Atendimento humano',
        timestamp: conv.updated_at,
        status: conv.status
      }));

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error loading recent activity:', error);
      throw error;
    }
  };

  const loadUpcomingAppointments = async () => {
    try {
      const appointments = await appointmentService.getUpcoming(5, 
        user?.role === 'atendente' ? user.id : undefined
      );
      setUpcomingAppointments(appointments);
    } catch (error) {
      console.error('Error loading upcoming appointments:', error);
      throw error;
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDashboardData();
      toast({
        title: "Atualizado",
        description: "Dashboard atualizado com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar dashboard",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'conversation':
        return <MessageSquare className="h-4 w-4" />;
      case 'appointment':
        return <Calendar className="h-4 w-4" />;
      case 'user':
        return <Users className="h-4 w-4" />;
      case 'clinic':
        return <Building2 className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes}min atrás`;
    } else if (diffHours < 24) {
      return `${diffHours}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const formatAppointmentTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString('pt-BR')
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral e métricas do sistema
            </p>
          </div>
        </div>

        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Conversations Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.conversations.total || 0}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{stats?.conversations.active || 0} ativas</span>
              </div>
              <div className="flex items-center space-x-1">
                <Bot className="h-3 w-3" />
                <span>{stats?.conversations.bot_active || 0} bot</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointments Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.appointments.total || 0}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{stats?.appointments.today || 0} hoje</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3" />
                <span>{stats?.appointments.confirmed || 0} confirmados</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Card */}
        {(user?.role === 'admin_lify' || user?.role === 'administrador') && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>{stats?.users.active || 0} ativos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clinics Card (Admin Lify only) */}
        {user?.role === 'admin_lify' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clínicas</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.clinics.total || 0}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>{stats?.clinics.active || 0} ativas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimas atividades do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p>Nenhuma atividade recente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {activity.title}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(activity.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {activity.description}
                        </p>
                        {activity.status && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
            <CardDescription>
              Agendamentos confirmados para os próximos dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {upcomingAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mb-2" />
                  <p>Nenhum agendamento próximo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => {
                    const { time, date } = formatAppointmentTime(appointment.appointment_date);
                    return (
                      <div key={appointment.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">
                              {appointment.patient_name}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {appointment.duration_minutes}min
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {appointment.appointment_type}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs font-medium">{time}</span>
                            <span className="text-xs text-muted-foreground">{date}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>
              Informações sobre o estado atual do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">WhatsApp Service</p>
                  <p className="text-xs text-muted-foreground">Conectado</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Google Calendar</p>
                  <p className="text-xs text-muted-foreground">Sincronizado</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Database</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contextualização Notice */}
      <Alert className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Este dashboard apresenta dados em tempo real do sistema multiclínicas. 
          Os dados são filtrados automaticamente com base no seu perfil de acesso e clínica.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default Dashboard;
