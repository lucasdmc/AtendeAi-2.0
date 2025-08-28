// =====================================================
// SERVIÇO DE INTEGRAÇÃO GOOGLE OAUTH - ATENDEAÍ 2.0
// =====================================================

import { supabase } from '@/integrations/supabase/client';

export interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
}

export interface GoogleCalendarIntegration {
  id: string;
  clinic_id: string;
  google_client_id: string;
  google_client_secret: string;
  google_refresh_token?: string;
  google_access_token?: string;
  google_token_expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class GoogleOAuthService {
  private readonly GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
  private readonly GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

  // Iniciar fluxo de OAuth
  async initiateOAuth(clinicId: string, redirectUri: string): Promise<string> {
    try {
      // Obter configurações da clínica
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('google_client_id')
        .eq('id', clinicId)
        .single();

      if (clinicError || !clinic?.google_client_id) {
        throw new Error('Clínica não configurada para Google OAuth');
      }

      const params = new URLSearchParams({
        client_id: clinic.google_client_id,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
        access_type: 'offline',
        prompt: 'consent',
        state: clinicId // Usar clinicId como state para segurança
      });

      return `${this.GOOGLE_OAUTH_URL}?${params.toString()}`;
    } catch (error) {
      console.error('Error initiating OAuth:', error);
      throw error;
    }
  }

  // Trocar código de autorização por tokens
  async exchangeCodeForTokens(
    authorizationCode: string, 
    clinicId: string, 
    redirectUri: string
  ): Promise<GoogleTokens> {
    try {
      // Obter configurações da clínica
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('google_client_id, google_client_secret')
        .eq('id', clinicId)
        .single();

      if (clinicError || !clinic?.google_client_id || !clinic?.google_client_secret) {
        throw new Error('Clínica não configurada para Google OAuth');
      }

      const response = await fetch(this.GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clinic.google_client_id,
          client_secret: clinic.google_client_secret,
          code: authorizationCode,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google OAuth error: ${errorData.error_description || errorData.error}`);
      }

      const tokens: GoogleTokens = await response.json();

      // Salvar tokens na clínica
      await this.saveTokensToClinic(clinicId, tokens);

      return tokens;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  // Salvar tokens na clínica
  private async saveTokensToClinic(clinicId: string, tokens: GoogleTokens): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

      const { error } = await supabase
        .from('clinics')
        .update({
          google_access_token: tokens.access_token,
          google_refresh_token: tokens.refresh_token,
          google_token_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', clinicId);

      if (error) {
        throw new Error(`Error saving tokens: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving tokens to clinic:', error);
      throw error;
    }
  }

  // Renovar token de acesso
  async refreshAccessToken(clinicId: string): Promise<string> {
    try {
      // Obter configurações da clínica
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('google_client_id, google_client_secret, google_refresh_token')
        .eq('id', clinicId)
        .single();

      if (clinicError || !clinic?.google_refresh_token) {
        throw new Error('Clínica não tem refresh token válido');
      }

      const response = await fetch(this.GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clinic.google_client_id,
          client_secret: clinic.google_client_secret,
          refresh_token: clinic.google_refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Google refresh token error: ${errorData.error_description || errorData.error}`);
      }

      const tokens: Partial<GoogleTokens> = await response.json();

      if (tokens.access_token) {
        // Atualizar token na clínica
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expires_in || 3600));

        const { error } = await supabase
          .from('clinics')
          .update({
            google_access_token: tokens.access_token,
            google_token_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', clinicId);

        if (error) {
          throw new Error(`Error updating access token: ${error.message}`);
        }

        return tokens.access_token;
      }

      throw new Error('No access token received from Google');
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  // Obter token de acesso válido
  async getValidAccessToken(clinicId: string): Promise<string> {
    try {
      // Verificar se o token atual ainda é válido
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('google_access_token, google_token_expires_at')
        .eq('id', clinicId)
        .single();

      if (clinicError) {
        throw new Error(`Error fetching clinic: ${clinicError.message}`);
      }

      if (!clinic?.google_access_token) {
        throw new Error('Clínica não tem token de acesso configurado');
      }

      // Verificar se o token expirou (com margem de 5 minutos)
      if (clinic.google_token_expires_at) {
        const expiresAt = new Date(clinic.google_token_expires_at);
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

        if (expiresAt <= fiveMinutesFromNow) {
          // Token expirou, renovar
          return await this.refreshAccessToken(clinicId);
        }
      }

      return clinic.google_access_token;
    } catch (error) {
      console.error('Error getting valid access token:', error);
      throw error;
    }
  }

  // Verificar se a integração está ativa
  async isIntegrationActive(clinicId: string): Promise<boolean> {
    try {
      const { data: clinic, error } = await supabase
        .from('clinics')
        .select('google_client_id, google_access_token')
        .eq('id', clinicId)
        .single();

      if (error) {
        return false;
      }

      return !!(clinic?.google_client_id && clinic?.google_access_token);
    } catch (error) {
      return false;
    }
  }
}

// Instância singleton
export const googleOAuthService = new GoogleOAuthService();
export default googleOAuthService;
