// =====================================================
// HOOK DE AUTENTICAÇÃO - ATENDEAÍ 2.0
// =====================================================

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import authService, { User, LoginCredentials } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
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
  // Usuário simulado para desenvolvimento - sem autenticação
  const mockUser: User = {
    id: 'dev-user-123',
    email: 'dev@atendeai.com',
    firstName: 'Usuário',
    lastName: 'Desenvolvimento',
    roles: ['admin_lify'],
    clinicId: 'cardioprime_blumenau_2024'
  };

  const user = mockUser;
  const isLoading = false;

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    // Simular login para desenvolvimento
    return true;
  };

  const logout = async (): Promise<void> => {
    // Simular logout para desenvolvimento
    console.log('Logout simulado');
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const hasAllRoles = (roles: string[]): boolean => {
    return roles.every(role => hasRole(role));
  };

  const isAdminLify = (): boolean => {
    return hasRole('admin_lify');
  };

  const isAdminClinic = (): boolean => {
    return hasRole('admin_clinic');
  };

  const isAttendant = (): boolean => {
    return hasRole('attendant');
  };

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
