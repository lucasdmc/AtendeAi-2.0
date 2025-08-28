// =====================================================
// TESTES DE AUTENTICAÇÃO - ATENDEAÍ 2.0
// =====================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import Auth from '@/pages/Auth';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    }
  }
}));

// Componente de teste para useAuth
const TestComponent = () => {
  const { user, isAuthenticated, signIn, signOut } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="user-email">{user?.email || 'no-user'}</div>
      <button 
        data-testid="signin-btn" 
        onClick={() => signIn('test@example.com', 'password123')}
      >
        Sign In
      </button>
      <button data-testid="signout-btn" onClick={signOut}>
        Sign Out
      </button>
    </div>
  );
};

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Sistema de Autenticação', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock da sessão inicial vazia
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null }
    });
  });

  describe('Hook useAuth', () => {
    it('deve inicializar com usuário não autenticado', async () => {
      renderWithAuth(<TestComponent />);
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
      });
    });

    it('deve fazer login com credenciais válidas', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {}
      };

      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      renderWithAuth(<TestComponent />);
      
      fireEvent.click(screen.getByTestId('signin-btn'));
      
      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });

    it('deve tratar erro de login', async () => {
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' }
      });

      renderWithAuth(<TestComponent />);
      
      fireEvent.click(screen.getByTestId('signin-btn'));
      
      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      });
    });

    it('deve fazer logout', async () => {
      (supabase.auth.signOut as any).mockResolvedValue({ error: null });

      renderWithAuth(<TestComponent />);
      
      fireEvent.click(screen.getByTestId('signout-btn'));
      
      await waitFor(() => {
        expect(supabase.auth.signOut).toHaveBeenCalled();
      });
    });
  });

  describe('Página de Login', () => {
    it('deve renderizar formulário de login', () => {
      renderWithAuth(<Auth />);
      
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/senha/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });

    it('deve validar campos obrigatórios', async () => {
      renderWithAuth(<Auth />);
      
      const submitButton = screen.getByRole('button', { name: /entrar/i });
      fireEvent.click(submitButton);
      
      // Verificar se o formulário não foi submetido sem dados
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('deve submeter formulário com dados válidos', async () => {
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: { id: 'test', email: 'test@example.com' } },
        error: null
      });

      renderWithAuth(<Auth />);
      
      fireEvent.change(screen.getByPlaceholderText(/email/i), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText(/senha/i), {
        target: { value: 'password123' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /entrar/i }));
      
      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });
    });
  });

  describe('Fluxo de Autenticação Completo', () => {
    it('deve completar ciclo login -> logout', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {}
      };

      // Mock do login
      (supabase.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      // Mock do logout
      (supabase.auth.signOut as any).mockResolvedValue({ error: null });

      renderWithAuth(<TestComponent />);
      
      // Verificar estado inicial
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
      
      // Fazer login
      fireEvent.click(screen.getByTestId('signin-btn'));
      
      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
      });
      
      // Fazer logout
      fireEvent.click(screen.getByTestId('signout-btn'));
      
      await waitFor(() => {
        expect(supabase.auth.signOut).toHaveBeenCalled();
      });
    });
  });
});

// Testes de Validação de Fluxo
describe('Validação de Fluxo de Autenticação', () => {
  it('deve validar tokens de sessão', async () => {
    const mockSession = {
      access_token: 'valid-token',
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    };

    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession }
    });

    renderWithAuth(<TestComponent />);
    
    await waitFor(() => {
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });
  });

  it('deve tratar expiração de token', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: { message: 'Token expired' }
    });

    renderWithAuth(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    });
  });
});
