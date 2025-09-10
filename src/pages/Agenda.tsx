import React from 'react';
import { Calendar as CalendarIcon, Settings, ExternalLink, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

const Agenda: React.FC = () => {
  const {
    integration,
    events,
    loading,
    authLoading,
    syncLoading,
    calendarUrl,
    handleGoogleAuth,
    handleDisconnect,
    handleSync,
    isConnected,
    status
  } = useGoogleCalendar();


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'expired':
        return 'Expirado';
      case 'error':
        return 'Erro';
      default:
        return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando integração...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center space-x-3 mb-6">
        <CalendarIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">Integração com Google Calendar</p>
        </div>
      </div>

      {!isConnected ? (
        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Google Calendar não conectado</AlertTitle>
            <AlertDescription>
              Para utilizar o calendário, você precisa conectar sua conta do Google Calendar.
              Após a conexão, o calendário será incorporado nesta tela.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Conectar Google Calendar</CardTitle>
              <CardDescription>
                Conecte sua conta do Google para visualizar e gerenciar seus calendários diretamente no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Funcionalidades incluídas:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Visualização de calendários do Google em tempo real</li>
                    <li>• Sincronização bidirecional de eventos</li>
                    <li>• Integração com agendamentos do sistema</li>
                    <li>• Notificações automáticas</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Requisitos:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Conta Google ativa</li>
                    <li>• Permissão para acessar calendários</li>
                    <li>• Conexão com internet estável</li>
                  </ul>
                </div>

                <Button 
                  onClick={handleGoogleAuth}
                  disabled={authLoading}
                  className="w-full sm:w-auto"
                >
                  {authLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Conectar Google Calendar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Integration Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Google Calendar Conectado</CardTitle>
                  <CardDescription>
                    {integration.calendar_name || 'Calendário Principal'}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(status)}>
                  {getStatusLabel(status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Calendário ID:</span><br />
                    <span className="text-muted-foreground font-mono text-xs">
                      {integration.google_calendar_id}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Última Sincronização:</span><br />
                    <span className="text-muted-foreground">
                      {integration.last_sync 
                        ? new Date(integration.last_sync).toLocaleString('pt-BR')
                        : 'Nunca'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Token Expira em:</span><br />
                    <span className="text-muted-foreground">
                      {new Date(integration.token_expiry).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Sincronização:</span><br />
                    <Badge variant={integration.sync_enabled ? 'default' : 'secondary'}>
                      {integration.sync_enabled ? 'Habilitada' : 'Desabilitada'}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
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

                  <Button variant="outline" asChild>
                    <a 
                      href={`https://calendar.google.com/calendar/u/0/r?cid=${integration.google_calendar_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir no Google
                    </a>
                  </Button>

                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </Button>

                  <Button variant="destructive" onClick={handleDisconnect}>
                    Desconectar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Alerts */}
          {status === 'expired' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Token Expirado</AlertTitle>
              <AlertDescription>
                O token de acesso ao Google Calendar expirou. Reconnecte sua conta para continuar usando a integração.
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro na Integração</AlertTitle>
              <AlertDescription>
                Ocorreu um erro na integração com o Google Calendar. Tente sincronizar novamente ou reconnectar sua conta.
              </AlertDescription>
            </Alert>
          )}

          {status === 'active' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Integração Ativa</AlertTitle>
              <AlertDescription>
                Sua integração com o Google Calendar está funcionando corretamente.
              </AlertDescription>
            </Alert>
          )}

          {/* Embedded Calendar */}
          {calendarUrl && status === 'active' && (
            <Card>
              <CardHeader>
                <CardTitle>Sua Agenda</CardTitle>
                <CardDescription>
                  Visualização integrada do seu Google Calendar
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    src={calendarUrl}
                    style={{
                      border: 0,
                      width: '100%',
                      height: '600px'
                    }}
                    frameBorder="0"
                    scrolling="no"
                    title="Google Calendar"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Integration Requirements Notice */}
          <div className="text-sm text-muted-foreground bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Requisitos não funcionais atendidos:</h4>
            <ul className="space-y-1">
              <li>• Integração mantida por longo período através de refresh tokens</li>
              <li>• Monitoramento de status da conexão em tempo real</li>
              <li>• Sincronização automática com controle manual disponível</li>
              <li>• Interface responsiva incorporada via iframe</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;