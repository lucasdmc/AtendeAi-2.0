import { useState, useEffect, createContext, useContext, ReactNode, useMemo } from 'react';
import type { User, Session } from '@supabase/supabase-js';

interface CustomUser extends User {
  clinic_id?: string;
}

interface AuthContextType {
  user: CustomUser | null;
  session: Session | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdminLify: () => boolean;
  canManageUsers: boolean;
  canManageClinics: boolean;
  canViewDashboard: boolean;
  canAccessConversations: boolean;
  canAccessCalendar: boolean;
  canAccessAppointments: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // Mock user and session for development
  const mockUser: CustomUser = {
    id: '1',
    email: 'admin@lify.com',
    role: 'admin' as any,
    clinic_id: '1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    email_confirmed_at: new Date().toISOString(),
    phone_confirmed_at: null,
    confirmation_sent_at: null,
    recovery_sent_at: null,
    email_change_sent_at: null,
    new_email: null,
    new_phone: null,
    invited_at: null,
    action_link: null,
    last_sign_in_at: new Date().toISOString(),
    identities: [],
    factors: [],
    is_anonymous: false
  };

  const mockSession: Session = {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: mockUser
  };

  const user = mockUser;
  const session = mockSession;
  const isAuthenticated = !!user;

  const isAdminLify = () => {
    return user?.role === 'admin';
  };

  // Permission checks using mock values
  const canManageUsers = useMemo(() => {
    return user?.role === 'admin';
  }, [user]);

  const canManageClinics = useMemo(() => {
    return user?.role === 'admin';
  }, [user]);

  const canViewDashboard = useMemo(() => {
    return true; // Todos podem ver dashboard
  }, [user]);

  const canAccessConversations = useMemo(() => {
    return true; // Todos podem acessar conversas
  }, [user]);

  const canAccessCalendar = useMemo(() => {
    return true; // Todos podem acessar calendário
  }, [user]);

  const canAccessAppointments = useMemo(() => {
    return true; // Todos podem acessar agendamentos
  }, [user]);

  const signOut = async (): Promise<void> => {
    console.log('Mock sign out');
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    signOut,
    isAdminLify,
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