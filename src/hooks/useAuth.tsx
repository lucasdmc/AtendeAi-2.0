// =====================================================
// HOOK DE AUTENTICAÇÃO SUPABASE - ATENDEAÍ 2.0
// =====================================================

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { permissionService } from '@/services/permissionService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => Promise<boolean>;
  hasAnyRole: (roles: string[]) => Promise<boolean>;
  hasAllRoles: (roles: string[]) => Promise<boolean>;
  isAdminLify: () => Promise<boolean>;
  isAdminClinic: () => Promise<boolean>;
  isAttendant: () => Promise<boolean>;
  getUserClinics: () => Promise<string[]>;
  canManageUsers: () => Promise<boolean>;
  canManageClinics: () => Promise<boolean>;
  canViewDashboard: () => Promise<boolean>;
  canAccessConversations: () => Promise<boolean>;
  canAccessCalendar: () => Promise<boolean>;
  canAccessAppointments: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão existente
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    getInitialSession();

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Try Supabase auth first
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'Erro inesperado durante o login' };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'Erro inesperado durante o cadastro' };
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Funções de verificação de roles usando PermissionService
  const hasRole = async (role: string): Promise<boolean> => {
    if (!user?.id) return false;
    return permissionService.hasRole(user.id, role);
  };

  const hasAnyRole = async (roles: string[]): Promise<boolean> => {
    if (!user?.id) return false;
    return permissionService.hasAnyRole(user.id, roles);
  };

  const hasAllRoles = async (roles: string[]): Promise<boolean> => {
    if (!user?.id) return false;
    return permissionService.hasAllRoles(user.id, roles);
  };

  const isAdminLify = async (): Promise<boolean> => {
    if (!user?.id) return false;
    return permissionService.isAdminLify(user.id);
  };

  const isAdminClinic = async (): Promise<boolean> => {
    if (!user?.id) return false;
    return permissionService.isAdminClinic(user.id);
  };

  const isAttendant = async (): Promise<boolean> => {
    if (!user?.id) return false;
    return permissionService.isAttendant(user.id);
  };

  const getUserClinics = async (): Promise<string[]> => {
    if (!user?.id) return [];
    return permissionService.getUserClinics(user.id);
  };

  const canManageUsers = async (): Promise<boolean> => {
    if (!user?.id) return false;
    return permissionService.canManageUsers(user.id);
  };

  const canManageClinics = async (): Promise<boolean> => {
    if (!user?.id) return false;
    return permissionService.canManageClinics(user.id);
  };

  const canViewDashboard = async (): Promise<boolean> => {
    if (!user?.id) return false;
    return permissionService.canViewDashboard(user.id);
  };

  const canAccessConversations = async (): Promise<boolean> => {
    if (!user?.id) return false;
    return permissionService.canAccessConversations(user.id);
  };

  const canAccessCalendar = async (): Promise<boolean> => {
    if (!user?.id) return false;
    return permissionService.canAccessCalendar(user.id);
  };

  const canAccessAppointments = async (): Promise<boolean> => {
    if (!user?.id) return false;
    return permissionService.canAccessAppointments(user.id);
  };

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signUp,
    signOut,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdminLify,
    isAdminClinic,
    isAttendant,
    getUserClinics,
    canManageUsers,
    canManageClinics,
    canViewDashboard,
    canAccessConversations,
    canAccessCalendar,
    canAccessAppointments,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
