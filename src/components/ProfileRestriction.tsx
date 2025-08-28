// =====================================================
// COMPONENTE DE RESTRIÇÕES POR PERFIL - ATENDEAÍ 2.0
// =====================================================

import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { permissionService } from '@/services/permissionService';

interface ProfileRestrictionProps {
  children: ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
  fallback?: ReactNode;
  showLoading?: boolean;
}

export const ProfileRestriction = ({ 
  children, 
  requiredRole, 
  requiredRoles, 
  fallback = null,
  showLoading = true
}: ProfileRestrictionProps) => {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setHasPermission(false);
      setIsLoading(false);
      return;
    }

    checkPermissions();
  }, [user, requiredRole, requiredRoles]);

  const checkPermissions = async () => {
    try {
      let permission = false;

      if (requiredRole) {
        permission = await permissionService.hasRole(user!.id, requiredRole);
      } else if (requiredRoles && requiredRoles.length > 0) {
        permission = await permissionService.hasAnyRole(user!.id, requiredRoles);
      } else {
        permission = true; // Sem restrições
      }

      setHasPermission(permission);
    } catch (error) {
      console.error('Error checking profile permissions:', error);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading se solicitado
  if (isLoading && showLoading) {
    return (
      <div className="inline-flex items-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mostrar fallback se não tem permissão
  if (!hasPermission) {
    return <>{fallback}</>;
  }

  // Mostrar conteúdo se tem permissão
  return <>{children}</>;
};

// Componentes específicos para cada perfil
export const AdminLifyOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <ProfileRestriction requiredRole="admin_lify" fallback={fallback}>
    {children}
  </ProfileRestriction>
);

export const AdminClinicOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <ProfileRestriction requiredRole="admin_clinic" fallback={fallback}>
    {children}
  </ProfileRestriction>
);

export const AttendantOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <ProfileRestriction requiredRole="attendant" fallback={fallback}>
    {children}
  </ProfileRestriction>
);

export const AdminOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <ProfileRestriction requiredRoles={['admin_lify', 'admin_clinic']} fallback={fallback}>
    {children}
  </ProfileRestriction>
);

export default ProfileRestriction;
