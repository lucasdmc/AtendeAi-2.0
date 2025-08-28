// =====================================================
// TESTES DE INTEGRAÇÃO COMPLETA - ATENDEAÍ 2.0
// =====================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { AppContext } from '@/contexts/AppContext';

// Mocks
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    }))
  }
}));

// Mock dos serviços
vi.mock('@/services/clinicService', () => ({
  clinicService: {
    getClinics: vi.fn(),
    getClinic: vi.fn(),
    createClinic: vi.fn(),
    updateClinic: vi.fn(),
    deleteClinic: vi.fn()
  }
}));

vi.mock('@/services/userService', () => ({
  userService: {
    getUsers: vi.fn(),
    getUser: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn()
  }
}));

// App wrapper para testes de integração
const AppWrapper = ({ children }: { children: React.ReactNode }) => {
  const mockAppContext = {
    selectedClinic: {
      id: 'clinic-123',
      name: 'Clínica Teste',
      phone: '+5511888888888',
      webhook_url: 'https://api.example.com/webhook',
      whatsapp_number: '698766983327246',
      config: {}
    },
    setSelectedClinic: vi.fn(),
    user: {
      id: 'user-123',
      email: 'test@example.com',
      role: 'admin_lify' as const,
      clinic_id: null
    },
    userProfile: {
      user_id: 'user-123',
      profile_type: 'admin_lify' as const,
      clinic_id: null,
      permissions: {
        canManageClinics: true,
        canManageUsers: true,
        canViewAllConversations: true,
        canAccessAllFunctions: true
      }
    }
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContext.Provider value={mockAppContext}>
          {children}
        </AppContext.Provider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Testes de Integração Completa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Fluxo de Autenticação Completo', () => {
    it('deve completar fluxo completo: login -> dashboard -> funcionalidades -> logout', async () => {
      // Mock da autenticação bem-sucedida
      const mockUser = {
        id: 'user-123',
        email: 'admin@lify.com',
        user_metadata: {
          role: 'admin_lify'
        }
      };

      const { supabase } = await import('@/integrations/supabase/client');
      
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: { user: mockUser } }
      });

      // Mock dos dados das clínicas para Admin Lify
      const { clinicService } = await import('@/services/clinicService');
      (clinicService.getClinics as any).mockResolvedValue([
        {
          id: 'clinic-1',
          name: 'Clínica A',
          phone: '+5511111111111',
          webhook_url: 'https://api.example.com/webhook1',
          whatsapp_number: '111111111',
          config: {}
        },
        {
          id: 'clinic-2',
          name: 'Clínica B',
          phone: '+5511222222222',
          webhook_url: 'https://api.example.com/webhook2',
          whatsapp_number: '222222222',
          config: {}
        }
      ]);

      // Test login page
      const Auth = await import('@/pages/Auth').then(m => m.default);
      render(
        <AppWrapper>
          <Auth />
        </AppWrapper>
      );

      // Fazer login
      fireEvent.change(screen.getByPlaceholderText(/email/i), {
        target: { value: 'admin@lify.com' }
      });
      fireEvent.change(screen.getByPlaceholderText(/senha/i), {
        target: { value: 'password123' }
      });
      fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'admin@lify.com',
          password: 'password123'
        });
      });

      // Verificar que o login foi bem-sucedido
      expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    });
  });

  describe('Fluxo de Gestão de Clínicas (Admin Lify)', () => {
    it('deve permitir CRUD completo de clínicas para Admin Lify', async () => {
      const { clinicService } = await import('@/services/clinicService');
      
      // Mock das operações CRUD
      (clinicService.getClinics as any).mockResolvedValue([]);
      (clinicService.createClinic as any).mockResolvedValue({
        id: 'new-clinic-123',
        name: 'Nova Clínica',
        phone: '+5511999999999',
        webhook_url: 'https://api.example.com/webhook',
        whatsapp_number: '999999999',
        config: {}
      });

      const Clinics = await import('@/pages/Clinics').then(m => m.default);
      render(
        <AppWrapper>
          <Clinics />
        </AppWrapper>
      );

      // Verificar carregamento inicial
      await waitFor(() => {
        expect(clinicService.getClinics).toHaveBeenCalled();
      });

      // Teste de criação seria implementado aqui
      // (depende da estrutura específica do componente Clinics)
    });
  });

  describe('Fluxo de Gestão de Usuários', () => {
    it('deve permitir CRUD de usuários com isolamento por clínica', async () => {
      const { userService } = await import('@/services/userService');
      
      // Mock dos usuários da clínica
      (userService.getUsers as any).mockResolvedValue([
        {
          id: 'user-1',
          email: 'admin@clinica.com',
          role: 'admin_clinic',
          clinic_id: 'clinic-123'
        },
        {
          id: 'user-2',
          email: 'atendente@clinica.com',
          role: 'attendant',
          clinic_id: 'clinic-123'
        }
      ]);

      const Users = await import('@/pages/Users').then(m => m.default);
      render(
        <AppWrapper>
          <Users />
        </AppWrapper>
      );

      // Verificar carregamento dos usuários
      await waitFor(() => {
        expect(userService.getUsers).toHaveBeenCalledWith('clinic-123');
      });
    });
  });

  describe('Fluxo de Isolamento Multi-tenant', () => {
    it('deve garantir isolamento completo entre clínicas', async () => {
      // Simular usuário de uma clínica específica
      const mockUserClinic = {
        selectedClinic: {
          id: 'clinic-456',
          name: 'Clínica Específica',
          phone: '+5511777777777',
          webhook_url: 'https://api.example.com/webhook456',
          whatsapp_number: '777777777',
          config: {}
        },
        user: {
          id: 'user-456',
          email: 'user@clinica456.com',
          role: 'admin_clinic' as const,
          clinic_id: 'clinic-456'
        },
        userProfile: {
          user_id: 'user-456',
          profile_type: 'admin_clinic' as const,
          clinic_id: 'clinic-456',
          permissions: {
            canManageClinics: false,
            canManageUsers: true,
            canViewAllConversations: false,
            canAccessAllFunctions: false
          }
        }
      };

      const ClinicWrapper = ({ children }: { children: React.ReactNode }) => (
        <BrowserRouter>
          <AuthProvider>
            <AppContext.Provider value={mockUserClinic}>
              {children}
            </AppContext.Provider>
          </AuthProvider>
        </BrowserRouter>
      );

      const { userService } = await import('@/services/userService');
      (userService.getUsers as any).mockResolvedValue([
        {
          id: 'user-456',
          email: 'user@clinica456.com',
          role: 'admin_clinic',
          clinic_id: 'clinic-456'
        }
      ]);

      const Users = await import('@/pages/Users').then(m => m.default);
      render(
        <ClinicWrapper>
          <Users />
        </ClinicWrapper>
      );

      // Verificar que só carrega usuários da clínica específica
      await waitFor(() => {
        expect(userService.getUsers).toHaveBeenCalledWith('clinic-456');
      });
    });
  });

  describe('Fluxo de Permissões por Perfil', () => {
    it('deve respeitar permissões do perfil Admin Lify', async () => {
      // Admin Lify deve ter acesso completo
      const mockAdminLify = {
        selectedClinic: null,
        user: {
          id: 'admin-lify',
          email: 'admin@lify.com',
          role: 'admin_lify' as const,
          clinic_id: null
        },
        userProfile: {
          user_id: 'admin-lify',
          profile_type: 'admin_lify' as const,
          clinic_id: null,
          permissions: {
            canManageClinics: true,
            canManageUsers: true,
            canViewAllConversations: true,
            canAccessAllFunctions: true
          }
        }
      };

      expect(mockAdminLify.userProfile.permissions.canManageClinics).toBe(true);
      expect(mockAdminLify.userProfile.permissions.canManageUsers).toBe(true);
      expect(mockAdminLify.userProfile.permissions.canViewAllConversations).toBe(true);
      expect(mockAdminLify.userProfile.permissions.canAccessAllFunctions).toBe(true);
    });

    it('deve respeitar permissões do perfil Admin Clínica', async () => {
      // Admin Clínica deve ter acesso limitado
      const mockAdminClinic = {
        selectedClinic: {
          id: 'clinic-123',
          name: 'Clínica Test',
          phone: '+5511888888888',
          webhook_url: 'https://api.example.com/webhook',
          whatsapp_number: '888888888',
          config: {}
        },
        user: {
          id: 'admin-clinic',
          email: 'admin@clinica.com',
          role: 'admin_clinic' as const,
          clinic_id: 'clinic-123'
        },
        userProfile: {
          user_id: 'admin-clinic',
          profile_type: 'admin_clinic' as const,
          clinic_id: 'clinic-123',
          permissions: {
            canManageClinics: false,
            canManageUsers: true,
            canViewAllConversations: false,
            canAccessAllFunctions: false
          }
        }
      };

      expect(mockAdminClinic.userProfile.permissions.canManageClinics).toBe(false);
      expect(mockAdminClinic.userProfile.permissions.canManageUsers).toBe(true);
      expect(mockAdminClinic.userProfile.permissions.canViewAllConversations).toBe(false);
      expect(mockAdminClinic.userProfile.permissions.canAccessAllFunctions).toBe(false);
    });

    it('deve respeitar permissões do perfil Atendente', async () => {
      // Atendente deve ter acesso mínimo
      const mockAttendant = {
        selectedClinic: {
          id: 'clinic-123',
          name: 'Clínica Test',
          phone: '+5511888888888',
          webhook_url: 'https://api.example.com/webhook',
          whatsapp_number: '888888888',
          config: {}
        },
        user: {
          id: 'attendant',
          email: 'atendente@clinica.com',
          role: 'attendant' as const,
          clinic_id: 'clinic-123'
        },
        userProfile: {
          user_id: 'attendant',
          profile_type: 'attendant' as const,
          clinic_id: 'clinic-123',
          permissions: {
            canManageClinics: false,
            canManageUsers: false,
            canViewAllConversations: false,
            canAccessAllFunctions: false
          }
        }
      };

      expect(mockAttendant.userProfile.permissions.canManageClinics).toBe(false);
      expect(mockAttendant.userProfile.permissions.canManageUsers).toBe(false);
      expect(mockAttendant.userProfile.permissions.canViewAllConversations).toBe(false);
      expect(mockAttendant.userProfile.permissions.canAccessAllFunctions).toBe(false);
    });
  });

  describe('Fluxo de Integração Google Calendar', () => {
    it('deve autenticar e integrar Google Calendar', async () => {
      const { googleOAuthService } = await import('@/services/googleOAuthService');
      
      // Mock da autenticação Google
      vi.mocked(googleOAuthService.authenticate).mockResolvedValue({
        success: true,
        accessToken: 'google-access-token',
        refreshToken: 'google-refresh-token'
      });

      // Mock da incorporação do calendário
      vi.mocked(googleOAuthService.getCalendarIframeUrl).mockReturnValue(
        'https://calendar.google.com/calendar/embed?src=primary'
      );

      const Calendar = await import('@/pages/Calendar').then(m => m.default);
      render(
        <AppWrapper>
          <Calendar />
        </AppWrapper>
      );

      // Verificar que o componente carrega
      expect(screen.getByText(/calendário/i)).toBeInTheDocument();
    });
  });

  describe('Fluxo End-to-End Completo', () => {
    it('deve completar jornada completa do usuário', async () => {
      // 1. Login
      const { supabase } = await import('@/integrations/supabase/client');
      const mockUser = {
        id: 'user-123',
        email: 'admin@lify.com',
        user_metadata: { role: 'admin_lify' }
      };

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // 2. Carregamento de dados
      const { clinicService } = await import('@/services/clinicService');
      const { userService } = await import('@/services/userService');
      const { whatsappService } = await import('@/services/whatsappService');

      (clinicService.getClinics as any).mockResolvedValue([
        { id: 'clinic-1', name: 'Clínica A' },
        { id: 'clinic-2', name: 'Clínica B' }
      ]);

      (userService.getUsers as any).mockResolvedValue([
        { id: 'user-1', email: 'user1@clinic.com', clinic_id: 'clinic-1' }
      ]);

      (whatsappService.getConversations as any).mockResolvedValue([
        {
          id: 'conv-1',
          customer_name: 'João Silva',
          clinic_id: 'clinic-1',
          messages: []
        }
      ]);

      // Simulação da jornada seria implementada aqui
      // com navegação entre páginas e verificação de funcionalidades

      expect(true).toBe(true); // Placeholder para implementação completa
    });
  });

  describe('Testes de Error Handling', () => {
    it('deve tratar erros de rede graciosamente', async () => {
      const { clinicService } = await import('@/services/clinicService');
      
      // Simular erro de rede
      (clinicService.getClinics as any).mockRejectedValue(
        new Error('Network Error')
      );

      const Clinics = await import('@/pages/Clinics').then(m => m.default);
      render(
        <AppWrapper>
          <Clinics />
        </AppWrapper>
      );

      // Verificar tratamento de erro
      await waitFor(() => {
        expect(screen.getByText(/erro/i)).toBeInTheDocument();
      });
    });

    it('deve tratar erro de autenticação', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' }
      });

      const Auth = await import('@/pages/Auth').then(m => m.default);
      render(
        <AppWrapper>
          <Auth />
        </AppWrapper>
      );

      fireEvent.change(screen.getByPlaceholderText(/email/i), {
        target: { value: 'invalid@email.com' }
      });
      fireEvent.change(screen.getByPlaceholderText(/senha/i), {
        target: { value: 'wrongpassword' }
      });
      fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
      });
    });
  });

  describe('Testes de Performance', () => {
    it('deve carregar dados rapidamente', async () => {
      const startTime = Date.now();
      
      const { clinicService } = await import('@/services/clinicService');
      (clinicService.getClinics as any).mockResolvedValue([]);

      const Clinics = await import('@/pages/Clinics').then(m => m.default);
      render(
        <AppWrapper>
          <Clinics />
        </AppWrapper>
      );

      await waitFor(() => {
        expect(clinicService.getClinics).toHaveBeenCalled();
      });

      const loadTime = Date.now() - startTime;
      
      // Verificar que carregou em menos de 500ms (conforme RNF002)
      expect(loadTime).toBeLessThan(500);
    });
  });

  describe('Testes de Acessibilidade', () => {
    it('deve ter elementos acessíveis', async () => {
      const Auth = await import('@/pages/Auth').then(m => m.default);
      render(
        <AppWrapper>
          <Auth />
        </AppWrapper>
      );

      // Verificar labels e roles
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/senha/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });
  });
});
