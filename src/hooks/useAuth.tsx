import { useState, useEffect, createContext, useContext, ReactNode, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface CustomUser extends Omit<User, 'user_metadata'> {
  clinic_id?: string;
  role?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    role?: string;
  };
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
  const [user, setUser] = useState<CustomUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          return;
        }
        setSession(session);
        const userData = session?.user as CustomUser || null;
        console.log('🔍 Setting User (Initial):', { userData, userMetadata: userData?.user_metadata });
        setUser(userData);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔍 Auth State Change:', { event, session, user: session?.user });
        setSession(session);
        const userData = session?.user as CustomUser || null;
        console.log('🔍 Setting User:', { userData, userMetadata: userData?.user_metadata });
        setUser(userData);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const isAuthenticated = !!user;

  const isAdminLify = () => {
    const isAdmin = user?.user_metadata?.role === 'admin_lify';
    console.log('🔍 isAdminLify Debug:', {
      user: user,
      userMetadata: user?.user_metadata,
      role: user?.user_metadata?.role,
      isAdmin: isAdmin
    });
    return isAdmin;
  };

  // Permission checks based on user role
  const canManageUsers = useMemo(() => {
    return user?.user_metadata?.role === 'admin_lify' || user?.user_metadata?.role === 'suporte_lify';
  }, [user]);

  const canManageClinics = useMemo(() => {
    return user?.user_metadata?.role === 'admin_lify' || user?.user_metadata?.role === 'suporte_lify';
  }, [user]);

  const canViewDashboard = useMemo(() => {
    return !!user; // Todos os usuários autenticados podem ver dashboard
  }, [user]);

  const canAccessConversations = useMemo(() => {
    return !!user; // Todos os usuários autenticados podem acessar conversas
  }, [user]);

  const canAccessCalendar = useMemo(() => {
    return !!user; // Todos os usuários autenticados podem acessar calendário
  }, [user]);

  const canAccessAppointments = useMemo(() => {
    return !!user; // Todos os usuários autenticados podem acessar agendamentos
  }, [user]);

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
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