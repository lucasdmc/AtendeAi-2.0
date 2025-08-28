// =====================================================
// COMPONENTE DE PROTEÇÃO DE ROTAS - ATENDEAÍ 2.0
// =====================================================

import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { permissionService } from '@/services/permissionService';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  requiredRoles?: string[];
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  requiredRoles 
}: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // Aguardar carregamento da autenticação
    if (isLoading) return;

    // Redirecionar para login se não autenticado
    if (!isAuthenticated) {
      console.log('🔒 Usuário não autenticado, redirecionando para /auth');
      navigate('/auth');
      return;
    }

    // Verificar permissões se necessário
    if (requiredRole || requiredRoles) {
      checkPermissions();
    } else {
      setHasPermission(true);
    }
  }, [isAuthenticated, isLoading, user, requiredRole, requiredRoles, navigate]);

  const checkPermissions = async () => {
    if (!user?.id) return;

    try {
      let permission = false;

      if (requiredRole) {
        permission = await permissionService.hasRole(user.id, requiredRole);
      } else if (requiredRoles && requiredRoles.length > 0) {
        permission = await permissionService.hasAnyRole(user.id, requiredRoles);
      }

      setHasPermission(permission);

      if (!permission) {
        console.log(`🔒 Usuário não tem permissão necessária, redirecionando para /`);
        navigate('/');
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setHasPermission(false);
      navigate('/');
    }
  };

  // Mostrar loading enquanto verifica autenticação ou permissões
  if (isLoading || hasPermission === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Não renderizar nada se não autenticado (será redirecionado)
  if (!isAuthenticated) {
    return null;
  }

  // Não renderizar nada se não tem permissão (será redirecionado)
  if (hasPermission === false) {
    return null;
  }

  // Renderizar conteúdo protegido
  return <>{children}</>;
};

export default ProtectedRoute;
