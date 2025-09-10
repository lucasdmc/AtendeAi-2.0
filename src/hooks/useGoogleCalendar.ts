// =====================================================
// HOOK GOOGLE CALENDAR - ATENDEAÍ 2.0
// =====================================================

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { googleCalendarSDK, GoogleIntegration, GoogleEvent } from '@/sdk/googleCalendarSDK';

export interface UseGoogleCalendarReturn {
  // State
  integration: GoogleIntegration | null;
  events: GoogleEvent[];
  loading: boolean;
  authLoading: boolean;
  syncLoading: boolean;
  calendarUrl: string;
  
  // Actions
  handleGoogleAuth: () => Promise<void>;
  handleDisconnect: () => Promise<void>;
  handleSync: () => Promise<void>;
  refreshIntegration: () => Promise<void>;
  loadEvents: (params?: { start_date?: string; end_date?: string; max_results?: number }) => Promise<void>;
  
  // Utils
  isConnected: boolean;
  status: 'active' | 'expired' | 'error' | 'disconnected';
}

export const useGoogleCalendar = (): UseGoogleCalendarReturn => {
  const [integration, setIntegration] = useState<GoogleIntegration | null>(null);
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [calendarUrl, setCalendarUrl] = useState<string>('');

  const { toast } = useToast();
  const { user } = useAuth();

  // =====================================================
  // LOAD INTEGRATION
  // =====================================================

  const loadIntegration = useCallback(async () => {
    try {
      if (!user?.id) return;

      const integrations = await googleCalendarSDK.getUserIntegrations(user.id);
      if (integrations.length > 0) {
        const activeIntegration = integrations[0];
        setIntegration(activeIntegration);
        
        // Generate calendar embed URL
        if (activeIntegration.google_calendar_id) {
          const embedUrl = googleCalendarSDK.generateCalendarEmbedUrl(activeIntegration.google_calendar_id);
          setCalendarUrl(embedUrl);
        }
      }
    } catch (error) {
      console.error('Error loading integration:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar integração com Google Calendar",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // =====================================================
  // GOOGLE AUTH
  // =====================================================

  const handleGoogleAuth = useCallback(async () => {
    try {
      setAuthLoading(true);
      
      // Get Google OAuth URL
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const authUrl = await googleCalendarSDK.getAuthUrl(redirectUri);
      
      // Open popup window for OAuth
      const popup = window.open(
        authUrl,
        'google-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      // Listen for completion
      const checkClosed = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          
          // Check if auth was successful
          try {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for callback processing
            await loadIntegration();
            
            if (integration) {
              toast({
                title: "Sucesso!",
                description: "Google Calendar integrado com sucesso!"
              });
            }
          } catch (error) {
            toast({
              title: "Erro",
              description: "Erro ao processar autenticação",
              variant: "destructive"
            });
          }
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        if (popup && !popup.closed) {
          popup.close();
        }
        setAuthLoading(false);
      }, 300000);

    } catch (error: any) {
      console.error('Error during Google auth:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao autenticar com Google",
        variant: "destructive"
      });
    } finally {
      setAuthLoading(false);
    }
  }, [loadIntegration, integration, toast]);

  // =====================================================
  // DISCONNECT
  // =====================================================

  const handleDisconnect = useCallback(async () => {
    if (!integration) return;

    const confirmed = confirm('Tem certeza que deseja desconectar o Google Calendar?');
    if (!confirmed) return;

    try {
      await googleCalendarSDK.disconnect(integration.id);
      setIntegration(null);
      setCalendarUrl('');
      setEvents([]);
      
      toast({
        title: "Desconectado",
        description: "Google Calendar desconectado com sucesso"
      });
    } catch (error: any) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao desconectar Google Calendar",
        variant: "destructive"
      });
    }
  }, [integration, toast]);

  // =====================================================
  // SYNC
  // =====================================================

  const handleSync = useCallback(async () => {
    if (!integration) return;

    try {
      setSyncLoading(true);
      await googleCalendarSDK.syncCalendar(integration.id);
      await loadIntegration();
      
      toast({
        title: "Sincronizado",
        description: "Calendário sincronizado com sucesso"
      });
    } catch (error: any) {
      console.error('Error syncing calendar:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao sincronizar calendário",
        variant: "destructive"
      });
    } finally {
      setSyncLoading(false);
    }
  }, [integration, loadIntegration, toast]);

  // =====================================================
  // REFRESH INTEGRATION
  // =====================================================

  const refreshIntegration = useCallback(async () => {
    if (!integration) return;

    try {
      const updatedIntegration = await googleCalendarSDK.refreshToken(integration.id);
      setIntegration(updatedIntegration);
    } catch (error: any) {
      console.error('Error refreshing integration:', error);
      toast({
        title: "Erro",
        description: "Erro ao renovar integração",
        variant: "destructive"
      });
    }
  }, [integration, toast]);

  // =====================================================
  // LOAD EVENTS
  // =====================================================

  const loadEvents = useCallback(async (params?: { 
    start_date?: string; 
    end_date?: string; 
    max_results?: number 
  }) => {
    if (!integration) return;

    try {
      const events = await googleCalendarSDK.getEvents(integration.id, params);
      setEvents(events);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar eventos",
        variant: "destructive"
      });
    }
  }, [integration, toast]);

  // =====================================================
  // EFFECTS
  // =====================================================

  useEffect(() => {
    loadIntegration();
  }, [loadIntegration]);

  // =====================================================
  // COMPUTED VALUES
  // =====================================================

  const isConnected = !!integration;
  const status = integration?.status || 'disconnected';

  return {
    // State
    integration,
    events,
    loading,
    authLoading,
    syncLoading,
    calendarUrl,
    
    // Actions
    handleGoogleAuth,
    handleDisconnect,
    handleSync,
    refreshIntegration,
    loadEvents,
    
    // Utils
    isConnected,
    status
  };
};
