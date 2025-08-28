// =====================================================
// TESTES DE CONTROLE DE ACESSO - ATENDEAÍ 2.0
// =====================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { permissionService } from '@/services/permissionService';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ProfileRestriction, AdminLifyOnly, AdminClinicOnly, AttendantOnly } from '@/components/ProfileRestriction';
import { AuthProvider } from '@/hooks/useAuth';

// Mock do PermissionService
vi.mock('@/services/permissionService', () => ({
  permissionService: {
    hasRole: vi.fn(),
    hasAnyRole: vi.fn(),
    isAdminLify: vi.fn(),
    isAdminClinic: vi.fn(),
    isAttendant: vi.fn(),
    canAccessClinicData: vi.fn(),
    getAccessibleClinics: vi.fn()
  }
}));

// Mock do useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123' },
    isAuthenticated: true,
    isLoading: false
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Controle de Acesso por Perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ProtectedRoute', () => {
    it('deve permitir acesso para usuário com role correto', async () => {
      (permissionService.hasRole as any).mockResolvedValue(true);

      renderWithRouter(
        <ProtectedRoute requiredRole="admin_lify">
          <div data-testid="protected-content">Conteúdo Protegido</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('deve bloquear acesso para usuário sem role necessário', async () => {
      (permissionService.hasRole as any).mockResolvedValue(false);

      renderWithRouter(
        <ProtectedRoute requiredRole="admin_lify">
          <div data-testid="protected-content">Conteúdo Protegido</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });
    });

    it('deve verificar múltiplos roles', async () => {
      (permissionService.hasAnyRole as any).mockResolvedValue(true);

      renderWithRouter(
        <ProtectedRoute requiredRoles={['admin_lify', 'admin_clinic']}>
          <div data-testid="protected-content">Conteúdo Protegido</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(permissionService.hasAnyRole).toHaveBeenCalledWith(
          'test-user-123',
          ['admin_lify', 'admin_clinic']
        );
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });

  describe('ProfileRestriction Components', () => {
    describe('AdminLifyOnly', () => {
      it('deve mostrar conteúdo para Admin Lify', async () => {
        (permissionService.hasRole as any).mockResolvedValue(true);

        renderWithRouter(
          <AdminLifyOnly>
            <div data-testid="admin-lify-content">Admin Lify Content</div>
          </AdminLifyOnly>
        );

        await waitFor(() => {
          expect(permissionService.hasRole).toHaveBeenCalledWith(
            'test-user-123',
            'admin_lify'
          );
          expect(screen.getByTestId('admin-lify-content')).toBeInTheDocument();
        });
      });

      it('deve esconder conteúdo para não-Admin Lify', async () => {
        (permissionService.hasRole as any).mockResolvedValue(false);

        renderWithRouter(
          <AdminLifyOnly>
            <div data-testid="admin-lify-content">Admin Lify Content</div>
          </AdminLifyOnly>
        );

        await waitFor(() => {
          expect(screen.queryByTestId('admin-lify-content')).not.toBeInTheDocument();
        });
      });

      it('deve mostrar fallback quando não tem permissão', async () => {
        (permissionService.hasRole as any).mockResolvedValue(false);

        renderWithRouter(
          <AdminLifyOnly fallback={<div data-testid="fallback">Sem permissão</div>}>
            <div data-testid="admin-lify-content">Admin Lify Content</div>
          </AdminLifyOnly>
        );

        await waitFor(() => {
          expect(screen.queryByTestId('admin-lify-content')).not.toBeInTheDocument();
          expect(screen.getByTestId('fallback')).toBeInTheDocument();
        });
      });
    });

    describe('AdminClinicOnly', () => {
      it('deve mostrar conteúdo para Admin Clinic', async () => {
        (permissionService.hasRole as any).mockResolvedValue(true);

        renderWithRouter(
          <AdminClinicOnly>
            <div data-testid="admin-clinic-content">Admin Clinic Content</div>
          </AdminClinicOnly>
        );

        await waitFor(() => {
          expect(permissionService.hasRole).toHaveBeenCalledWith(
            'test-user-123',
            'admin_clinic'
          );
          expect(screen.getByTestId('admin-clinic-content')).toBeInTheDocument();
        });
      });
    });

    describe('AttendantOnly', () => {
      it('deve mostrar conteúdo para Attendant', async () => {
        (permissionService.hasRole as any).mockResolvedValue(true);

        renderWithRouter(
          <AttendantOnly>
            <div data-testid="attendant-content">Attendant Content</div>
          </AttendantOnly>
        );

        await waitFor(() => {
          expect(permissionService.hasRole).toHaveBeenCalledWith(
            'test-user-123',
            'attendant'
          );
          expect(screen.getByTestId('attendant-content')).toBeInTheDocument();
        });
      });
    });
  });

  describe('Isolamento de Clínicas', () => {
    it('deve permitir acesso a dados da clínica autorizada', async () => {
      (permissionService.canAccessClinicData as any).mockResolvedValue(true);

      const clinicId = 'clinic-123';
      const result = await permissionService.canAccessClinicData('test-user-123', clinicId);

      expect(result).toBe(true);
      expect(permissionService.canAccessClinicData).toHaveBeenCalledWith(
        'test-user-123',
        clinicId
      );
    });

    it('deve bloquear acesso a dados de clínica não autorizada', async () => {
      (permissionService.canAccessClinicData as any).mockResolvedValue(false);

      const clinicId = 'unauthorized-clinic';
      const result = await permissionService.canAccessClinicData('test-user-123', clinicId);

      expect(result).toBe(false);
    });

    it('deve retornar apenas clínicas acessíveis', async () => {
      const mockClinics = ['clinic-1', 'clinic-2'];
      (permissionService.getAccessibleClinics as any).mockResolvedValue(mockClinics);

      const result = await permissionService.getAccessibleClinics('test-user-123');

      expect(result).toEqual(mockClinics);
      expect(permissionService.getAccessibleClinics).toHaveBeenCalledWith('test-user-123');
    });
  });

  describe('Cenários de Perfis Específicos', () => {
    it('deve validar permissões de Admin Lify', async () => {
      (permissionService.isAdminLify as any).mockResolvedValue(true);
      (permissionService.getAccessibleClinics as any).mockResolvedValue([
        'clinic-1', 'clinic-2', 'clinic-3'
      ]);

      const isAdmin = await permissionService.isAdminLify('test-user-123');
      const clinics = await permissionService.getAccessibleClinics('test-user-123');

      expect(isAdmin).toBe(true);
      expect(clinics).toHaveLength(3); // Admin Lify tem acesso a todas
    });

    it('deve validar permissões de Admin Clinic', async () => {
      (permissionService.isAdminClinic as any).mockResolvedValue(true);
      (permissionService.getAccessibleClinics as any).mockResolvedValue(['clinic-1']);

      const isAdmin = await permissionService.isAdminClinic('test-user-123');
      const clinics = await permissionService.getAccessibleClinics('test-user-123');

      expect(isAdmin).toBe(true);
      expect(clinics).toHaveLength(1); // Admin Clinic tem acesso apenas à sua clínica
    });

    it('deve validar permissões de Attendant', async () => {
      (permissionService.isAttendant as any).mockResolvedValue(true);
      (permissionService.getAccessibleClinics as any).mockResolvedValue(['clinic-1']);

      const isAttendant = await permissionService.isAttendant('test-user-123');
      const clinics = await permissionService.getAccessibleClinics('test-user-123');

      expect(isAttendant).toBe(true);
      expect(clinics).toHaveLength(1); // Attendant tem acesso apenas à sua clínica
    });
  });

  describe('Casos de Erro', () => {
    it('deve tratar erro na verificação de permissões', async () => {
      (permissionService.hasRole as any).mockRejectedValue(new Error('Database error'));

      renderWithRouter(
        <ProtectedRoute requiredRole="admin_lify">
          <div data-testid="protected-content">Conteúdo Protegido</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        // Em caso de erro, deve bloquear acesso por segurança
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });
    });

    it('deve tratar usuário sem ID', async () => {
      // Mock do useAuth sem usuário
      vi.mocked(require('@/hooks/useAuth').useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });

      renderWithRouter(
        <ProfileRestriction requiredRole="admin_lify">
          <div data-testid="protected-content">Conteúdo Protegido</div>
        </ProfileRestriction>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      });
    });
  });
});
