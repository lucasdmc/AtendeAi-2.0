// =====================================================
// SERVIÇO DE AUTENTICAÇÃO - ATENDEAÍ 2.0
// =====================================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  clinicId: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  clinicId: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
  message: string;
}

export interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
  };
  message: string;
}

class AuthService {
  private baseURL = 'http://localhost:3001/api/v1/auth';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private user: User | null = null;

  constructor() {
    // Recuperar tokens do localStorage
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
    
    // Recuperar dados do usuário
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
    }
  }

  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data: AuthResponse = await response.json();

      if (data.success) {
        this.accessToken = data.data.accessToken;
        this.refreshToken = data.data.refreshToken;
        this.user = data.data.user;

        // Salvar no localStorage
        localStorage.setItem('accessToken', this.accessToken);
        localStorage.setItem('refreshToken', this.refreshToken);
        localStorage.setItem('user', JSON.stringify(this.user));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Falha na conexão com o servidor');
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      if (this.refreshToken) {
        await fetch(`${this.baseURL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refreshToken: this.refreshToken,
            clinicId: this.user?.clinicId,
          }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Limpar dados locais
      this.accessToken = null;
      this.refreshToken = null;
      this.user = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // Refresh token
  async refreshTokens(): Promise<boolean> {
    try {
      if (!this.refreshToken || !this.user?.clinicId) {
        return false;
      }

      const response = await fetch(`${this.baseURL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken,
          clinicId: this.user.clinicId,
        }),
      });

      const data: RefreshResponse = await response.json();

      if (data.success) {
        this.accessToken = data.data.accessToken;
        this.refreshToken = data.data.refreshToken;

        // Atualizar localStorage
        localStorage.setItem('accessToken', this.accessToken);
        localStorage.setItem('refreshToken', this.refreshToken);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Refresh error:', error);
      return false;
    }
  }

  // Validar token
  async validateToken(): Promise<boolean> {
    try {
      if (!this.accessToken) {
        return false;
      }

      const response = await fetch(`${this.baseURL}/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (response.status === 401) {
        // Token expirado, tentar refresh
        const refreshed = await this.refreshTokens();
        if (refreshed) {
          return await this.validateToken();
        }
        return false;
      }

      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.user;
  }

  // Obter usuário atual
  getCurrentUser(): User | null {
    return this.user;
  }

  // Obter token de acesso
  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Verificar se tem role específico
  hasRole(role: string): boolean {
    return this.user?.roles.includes(role) || false;
  }

  // Verificar se tem qualquer um dos roles
  hasAnyRole(roles: string[]): boolean {
    return this.user?.roles.some(role => roles.includes(role)) || false;
  }

  // Verificar se tem todos os roles
  hasAllRoles(roles: string[]): boolean {
    return this.user?.roles.every(role => roles.includes(role)) || false;
  }

  // Verificar se é admin Lify
  isAdminLify(): boolean {
    return this.hasRole('admin_lify');
  }

  // Verificar se é admin de clínica
  isAdminClinic(): boolean {
    return this.hasRole('admin_clinic');
  }

  // Verificar se é atendente
  isAttendant(): boolean {
    return this.hasRole('attendant');
  }
}

// Instância singleton
export const authService = new AuthService();
export default authService;
