// =====================================================
// HOOK DE AUTENTICAÇÃO (Supabase) - ATENDEAÍ 2.0
// =====================================================

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AppUser {
  id: string;
  email: string | null;
  roles: string[];
  clinicId?: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  isAdminLify: () => boolean;
  isAdminClinic: () => boolean;
  isAttendant: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const mapUser = (u: any | null): AppUser | null => {
      if (!u) return null;
      const roles = (u.app_metadata?.roles || u.user_metadata?.roles || []) as string[];
      const clinicId = (u.app_metadata?.clinic_id || u.user_metadata?.clinic_id || null) as string | null;
      return {
        id: u.id,
        email: u.email,
        roles: Array.isArray(roles) ? roles : [],
        clinicId,
      };
    };

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const u = data.session?.user ?? null;
        setUser(mapUser(u));
      } finally {
        setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(mapUser(session?.user ?? null));
    });

    init();
    return () => subscription?.unsubscribe();
  }, []);

  const login = async ({ email, password }: { email: string; password: string }): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return !error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (role: string): boolean => !!user?.roles?.includes(role);
  const hasAnyRole = (roles: string[]): boolean => roles.some(r => hasRole(r));
  const hasAllRoles = (roles: string[]): boolean => roles.every(r => hasRole(r));
  const isAdminLify = (): boolean => hasRole('admin_lify');
  const isAdminClinic = (): boolean => hasRole('admin_clinic');
  const isAttendant = (): boolean => hasRole('attendant');

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdminLify,
    isAdminClinic,
    isAttendant,
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
