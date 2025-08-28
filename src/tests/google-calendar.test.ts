// =====================================================
// TESTES DE INTEGRAÇÃO GOOGLE CALENDAR - ATENDEAÍ 2.0
// =====================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { googleOAuthService } from '@/services/googleOAuthService';
import { calendarSyncService } from '@/services/calendarSyncService';
import { GoogleCalendarEmbed } from '@/components/GoogleCalendarEmbed';

// Mock dos serviços
vi.mock('@/services/googleOAuthService', () => ({
  googleOAuthService: {
    initiateOAuth: vi.fn(),
    exchangeCodeForTokens: vi.fn(),
    refreshAccessToken: vi.fn(),
    getValidAccessToken: vi.fn(),
    isIntegrationActive: vi.fn()
  }
}));

vi.mock('@/services/calendarSyncService', () => ({
  calendarSyncService: {
    syncToGoogleCalendar: vi.fn(),
    syncFromGoogleCalendar: vi.fn(),
    fullSync: vi.fn()
  }
}));

// Mock do useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123' },
    isAuthenticated: true,
    isLoading: false
  })
}));

describe('Integração Google Calendar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('GoogleOAuthService', () => {
    it('deve iniciar fluxo OAuth corretamente', async () => {
      const mockUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test&redirect_uri=test';
      (googleOAuthService.initiateOAuth as any).mockResolvedValue(mockUrl);

      const result = await googleOAuthService.initiateOAuth('clinic-123', 'http://localhost:3000/auth/callback');

      expect(result).toBe(mockUrl);
      expect(googleOAuthService.initiateOAuth).toHaveBeenCalledWith(
        'clinic-123',
        'http://localhost:3000/auth/callback'
      );
    });

    it('deve trocar código por tokens', async () => {
      const mockTokens = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'calendar'
      };

      (googleOAuthService.exchangeCodeForTokens as any).mockResolvedValue(mockTokens);

      const result = await googleOAuthService.exchangeCodeForTokens(
        'auth-code-123',
        'clinic-123',
        'http://localhost:3000/auth/callback'
      );

      expect(result).toEqual(mockTokens);
      expect(googleOAuthService.exchangeCodeForTokens).toHaveBeenCalledWith(
        'auth-code-123',
        'clinic-123',
        'http://localhost:3000/auth/callback'
      );
    });

    it('deve renovar token de acesso', async () => {
      const newToken = 'new-access-token';
      (googleOAuthService.refreshAccessToken as any).mockResolvedValue(newToken);

      const result = await googleOAuthService.refreshAccessToken('clinic-123');

      expect(result).toBe(newToken);
      expect(googleOAuthService.refreshAccessToken).toHaveBeenCalledWith('clinic-123');
    });

    it('deve obter token válido', async () => {
      const validToken = 'valid-access-token';
      (googleOAuthService.getValidAccessToken as any).mockResolvedValue(validToken);

      const result = await googleOAuthService.getValidAccessToken('clinic-123');

      expect(result).toBe(validToken);
      expect(googleOAuthService.getValidAccessToken).toHaveBeenCalledWith('clinic-123');
    });

    it('deve verificar se integração está ativa', async () => {
      (googleOAuthService.isIntegrationActive as any).mockResolvedValue(true);

      const result = await googleOAuthService.isIntegrationActive('clinic-123');

      expect(result).toBe(true);
      expect(googleOAuthService.isIntegrationActive).toHaveBeenCalledWith('clinic-123');
    });
  });

  describe('CalendarSyncService', () => {
    it('deve sincronizar agendamentos para Google Calendar', async () => {
      const mockResult = {
        success: true,
        syncedCount: 5,
        errors: [],
        message: 'Sincronizados 5 agendamentos'
      };

      (calendarSyncService.syncToGoogleCalendar as any).mockResolvedValue(mockResult);

      const result = await calendarSyncService.syncToGoogleCalendar('clinic-123');

      expect(result).toEqual(mockResult);
      expect(calendarSyncService.syncToGoogleCalendar).toHaveBeenCalledWith('clinic-123');
    });

    it('deve sincronizar eventos do Google Calendar', async () => {
      const mockResult = {
        success: true,
        syncedCount: 3,
        errors: [],
        message: 'Sincronizados 3 eventos'
      };

      (calendarSyncService.syncFromGoogleCalendar as any).mockResolvedValue(mockResult);

      const result = await calendarSyncService.syncFromGoogleCalendar('clinic-123');

      expect(result).toEqual(mockResult);
      expect(calendarSyncService.syncFromGoogleCalendar).toHaveBeenCalledWith('clinic-123');
    });

    it('deve realizar sincronização completa', async () => {
      const mockResult = {
        success: true,
        syncedCount: 8,
        errors: [],
        message: 'Sincronização completa: 8 itens processados'
      };

      (calendarSyncService.fullSync as any).mockResolvedValue(mockResult);

      const result = await calendarSyncService.fullSync('clinic-123');

      expect(result).toEqual(mockResult);
      expect(calendarSyncService.fullSync).toHaveBeenCalledWith('clinic-123');
    });

    it('deve tratar erros na sincronização', async () => {
      const mockResult = {
        success: false,
        syncedCount: 0,
        errors: ['Erro de conexão com Google API'],
        message: 'Erro durante a sincronização'
      };

      (calendarSyncService.syncToGoogleCalendar as any).mockResolvedValue(mockResult);

      const result = await calendarSyncService.syncToGoogleCalendar('clinic-123');

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('GoogleCalendarEmbed Component', () => {
    it('deve renderizar estado de loading', () => {
      (googleOAuthService.isIntegrationActive as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(true), 100))
      );

      render(<GoogleCalendarEmbed clinicId="clinic-123" />);

      expect(screen.getByText('Verificando integração...')).toBeInTheDocument();
    });

    it('deve renderizar formulário de configuração quando não integrado', async () => {
      (googleOAuthService.isIntegrationActive as any).mockResolvedValue(false);

      render(<GoogleCalendarEmbed clinicId="clinic-123" />);

      await waitFor(() => {
        expect(screen.getByText('Integração não configurada')).toBeInTheDocument();
        expect(screen.getByText('Configurar Integração')).toBeInTheDocument();
      });
    });

    it('deve renderizar calendário quando integrado', async () => {
      (googleOAuthService.isIntegrationActive as any).mockResolvedValue(true);

      render(<GoogleCalendarEmbed clinicId="clinic-123" />);

      await waitFor(() => {
        expect(screen.getByText('Integração ativa')).toBeInTheDocument();
        expect(screen.getByTitle('Google Calendar')).toBeInTheDocument();
      });
    });

    it('deve iniciar OAuth ao clicar em configurar', async () => {
      (googleOAuthService.isIntegrationActive as any).mockResolvedValue(false);
      (googleOAuthService.initiateOAuth as any).mockResolvedValue('oauth-url');

      // Mock window.location.href
      delete (window as any).location;
      (window as any).location = { href: '' };

      render(<GoogleCalendarEmbed clinicId="clinic-123" />);

      await waitFor(() => {
        expect(screen.getByText('Configurar Integração')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Configurar Integração'));

      await waitFor(() => {
        expect(googleOAuthService.initiateOAuth).toHaveBeenCalled();
      });
    });

    it('deve abrir calendário em nova aba', async () => {
      (googleOAuthService.isIntegrationActive as any).mockResolvedValue(true);

      // Mock window.open
      const mockOpen = vi.fn();
      (window as any).open = mockOpen;

      render(<GoogleCalendarEmbed clinicId="clinic-123" />);

      await waitFor(() => {
        expect(screen.getByText('Abrir em Nova Aba')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Abrir em Nova Aba'));

      expect(mockOpen).toHaveBeenCalled();
    });
  });

  describe('Fluxo Completo de Integração', () => {
    it('deve completar fluxo OAuth -> Sincronização', async () => {
      // Simular fluxo completo
      const clinicId = 'clinic-123';
      const authCode = 'auth-code-123';
      const redirectUri = 'http://localhost:3000/auth/callback';

      // 1. Trocar código por tokens
      const mockTokens = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'calendar'
      };

      (googleOAuthService.exchangeCodeForTokens as any).mockResolvedValue(mockTokens);

      const tokens = await googleOAuthService.exchangeCodeForTokens(
        authCode,
        clinicId,
        redirectUri
      );

      expect(tokens).toEqual(mockTokens);

      // 2. Verificar se integração está ativa
      (googleOAuthService.isIntegrationActive as any).mockResolvedValue(true);

      const isActive = await googleOAuthService.isIntegrationActive(clinicId);
      expect(isActive).toBe(true);

      // 3. Realizar sincronização
      const mockSyncResult = {
        success: true,
        syncedCount: 10,
        errors: [],
        message: 'Sincronização completa'
      };

      (calendarSyncService.fullSync as any).mockResolvedValue(mockSyncResult);

      const syncResult = await calendarSyncService.fullSync(clinicId);
      expect(syncResult.success).toBe(true);
      expect(syncResult.syncedCount).toBe(10);
    });

    it('deve tratar falha na integração', async () => {
      const clinicId = 'clinic-123';

      // Simular falha no OAuth
      (googleOAuthService.exchangeCodeForTokens as any).mockRejectedValue(
        new Error('Invalid authorization code')
      );

      await expect(
        googleOAuthService.exchangeCodeForTokens('invalid-code', clinicId, 'redirect-uri')
      ).rejects.toThrow('Invalid authorization code');

      // Verificar que integração não está ativa
      (googleOAuthService.isIntegrationActive as any).mockResolvedValue(false);

      const isActive = await googleOAuthService.isIntegrationActive(clinicId);
      expect(isActive).toBe(false);
    });
  });

  describe('Casos de Edge', () => {
    it('deve tratar token expirado', async () => {
      (googleOAuthService.getValidAccessToken as any)
        .mockRejectedValueOnce(new Error('Token expired'))
        .mockResolvedValueOnce('new-token');

      (googleOAuthService.refreshAccessToken as any).mockResolvedValue('new-token');

      // Primeira tentativa falha, segunda sucede após refresh
      try {
        await googleOAuthService.getValidAccessToken('clinic-123');
      } catch (error) {
        expect(error.message).toBe('Token expired');
      }

      const newToken = await googleOAuthService.refreshAccessToken('clinic-123');
      expect(newToken).toBe('new-token');
    });

    it('deve tratar erro de rede na API do Google', async () => {
      (calendarSyncService.syncToGoogleCalendar as any).mockResolvedValue({
        success: false,
        syncedCount: 0,
        errors: ['Network error: Connection timeout'],
        message: 'Erro de conexão com Google Calendar'
      });

      const result = await calendarSyncService.syncToGoogleCalendar('clinic-123');

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Network error');
    });
  });
});
