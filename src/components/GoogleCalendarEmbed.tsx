// =====================================================
// COMPONENTE DE INTEGRAÇÃO GOOGLE CALENDAR - ATENDEAÍ 2.0
// =====================================================

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { googleOAuthService } from '@/services/googleOAuthService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ExternalLink, Settings } from 'lucide-react';

interface GoogleCalendarEmbedProps {
  clinicId: string;
  height?: string;
  showControls?: boolean;
}

export const GoogleCalendarEmbed = ({ 
  clinicId, 
  height = '600px',
  showControls = true 
}: GoogleCalendarEmbedProps) => {
  const { user } = useAuth();
  const [isIntegrationActive, setIsIntegrationActive] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [calendarUrl, setCalendarUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkIntegrationStatus();
  }, [clinicId]);

  const checkIntegrationStatus = async () => {
    try {
      setIsLoading(true);
      setError('');

      const isActive = await googleOAuthService.isIntegrationActive(clinicId);
      setIsIntegrationActive(isActive);

      if (isActive) {
        // Gerar URL do calendário
        const calendarUrl = `https://calendar.google.com/calendar/embed?src=${clinicId}@group.calendar.google.com&ctz=America/Sao_Paulo`;
        setCalendarUrl(calendarUrl);
      }
    } catch (error) {
      console.error('Error checking integration status:', error);
      setError('Erro ao verificar status da integração');
    } finally {
      setIsLoading(false);
    }
  };

  const initiateOAuth = async () => {
    try {
      setError('');
      setIsLoading(true);

      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const oauthUrl = await googleOAuthService.initiateOAuth(clinicId, redirectUri);
      
      // Redirecionar para Google OAuth
      window.location.href = oauthUrl;
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      setError('Erro ao iniciar autenticação Google');
      setIsLoading(false);
    }
  };

  const openCalendarInNewTab = () => {
    if (calendarUrl) {
      window.open(calendarUrl, '_blank');
    }
  };

  const openCalendarSettings = () => {
    const settingsUrl = `https://calendar.google.com/calendar/u/0/r/settings`;
    window.open(settingsUrl, '_blank');
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Verificando integração...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isIntegrationActive) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Google Calendar
          </CardTitle>
          <CardDescription>
            Integre seu calendário do Google para gerenciar agendamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center p-8">
          <div className="mb-4">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Integração não configurada</h3>
            <p className="text-muted-foreground mb-6">
              Para usar o Google Calendar, é necessário configurar a integração OAuth.
            </p>
          </div>
          
          <Button 
            onClick={initiateOAuth} 
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurar Integração
          </Button>
          
          {error && (
            <p className="text-red-500 text-sm mt-4">{error}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Google Calendar
        </CardTitle>
        <CardDescription>
          Calendário integrado do Google
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {showControls && (
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Integração ativa
              </span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openCalendarInNewTab}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir em Nova Aba
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={openCalendarSettings}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </div>
          </div>
        )}
        
        <div className="relative">
          <iframe
            src={calendarUrl}
            style={{ width: '100%', height, border: 'none' }}
            title="Google Calendar"
            allowFullScreen
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarEmbed;
