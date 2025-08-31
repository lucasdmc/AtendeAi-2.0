import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { userService } from '@/services/userService';
import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

// Mock Supabase
vi.mock('@/integrations/supabase/client');
// Mock bcrypt
vi.mock('bcryptjs');

const mockSupabase = supabase as any;
const mockBcrypt = bcrypt as any;

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      single: vi.fn(),
    });

    mockSupabase.auth = {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      })
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('list', () => {
    it('should list users successfully', async () => {
      // Arrange
      const mockUsers = [
        {
          id: '1',
          name: 'João Silva',
          login: 'joao@clinica.com',
          role: 'atendente',
          clinic_id: 'clinic-1',
          status: 'active',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          clinic: { id: 'clinic-1', name: 'Clínica Teste' },
        },
      ];

      const mockChain = {
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockUsers,
          error: null,
          count: 1,
        }),
      };

      mockSupabase.from().select.mockReturnValue(mockChain);

      // Act
      const result = await userService.list();

      // Assert
      expect(result).toEqual({
        data: mockUsers,
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
          has_next: false,
          has_prev: false,
        },
      });
    });

    it('should apply filters correctly', async () => {
      // Arrange
      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabase.from().select.mockReturnValue(mockChain);

      // Act
      await userService.list({
        role: 'atendente',
        status: 'active',
        clinic_id: 'clinic-1',
        search: 'joão',
      });

      // Assert
      expect(mockChain.eq).toHaveBeenCalledWith('role', 'atendente');
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockChain.eq).toHaveBeenCalledWith('clinic_id', 'clinic-1');
      expect(mockChain.or).toHaveBeenCalledWith('name.ilike.%joão%,login.ilike.%joão%');
    });
  });

  describe('getById', () => {
    it('should get user by id successfully', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        name: 'João Silva',
        login: 'joao@clinica.com',
        role: 'atendente',
        clinic_id: 'clinic-1',
        status: 'active',
        clinic: { id: 'clinic-1', name: 'Clínica Teste' },
      };

      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUser,
          error: null,
        }),
      };

      mockSupabase.from().select.mockReturnValue(mockChain);

      // Act
      const result = await userService.getById('1');

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should handle user not found', async () => {
      // Arrange
      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };

      mockSupabase.from().select.mockReturnValue(mockChain);

      // Act & Assert
      await expect(userService.getById('999')).rejects.toThrow('Usuário não encontrado');
    });
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      // Arrange
      const newUserData = {
        name: 'Maria Santos',
        login: 'maria@clinica.com',
        password: 'senha123',
        role: 'atendente' as const,
        clinic_id: 'clinic-1',
      };

      const mockCreatedUser = {
        id: '2',
        name: 'Maria Santos',
        login: 'maria@clinica.com',
        role: 'atendente',
        clinic_id: 'clinic-1',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        clinic: { id: 'clinic-1', name: 'Clínica Teste' },
      };

      mockBcrypt.hash.mockResolvedValue('hashed-password');

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCreatedUser,
          error: null,
        }),
      };

      mockSupabase.from().insert.mockReturnValue(mockChain);

      // Act
      const result = await userService.create(newUserData);

      // Assert
      expect(mockBcrypt.hash).toHaveBeenCalledWith('senha123', 12);
      expect(result).toEqual(mockCreatedUser);
    });

    it('should validate required fields', async () => {
      // Act & Assert
      await expect(
        userService.create({
          name: '',
          login: 'maria@clinica.com',
          password: 'senha123',
          role: 'atendente',
          clinic_id: 'clinic-1',
        })
      ).rejects.toThrow('Todos os campos obrigatórios devem ser preenchidos');
    });

    it('should validate email format', async () => {
      // Act & Assert
      await expect(
        userService.create({
          name: 'Maria Santos',
          login: 'invalid-email',
          password: 'senha123',
          role: 'atendente',
          clinic_id: 'clinic-1',
        })
      ).rejects.toThrow('Formato de email inválido');
    });

    it('should validate password length', async () => {
      // Act & Assert
      await expect(
        userService.create({
          name: 'Maria Santos',
          login: 'maria@clinica.com',
          password: '123',
          role: 'atendente',
          clinic_id: 'clinic-1',
        })
      ).rejects.toThrow('Senha deve ter pelo menos 6 caracteres');
    });

    it('should handle duplicate email', async () => {
      // Arrange
      mockBcrypt.hash.mockResolvedValue('hashed-password');

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '23505' },
        }),
      };

      mockSupabase.from().insert.mockReturnValue(mockChain);

      // Act & Assert
      await expect(
        userService.create({
          name: 'Maria Santos',
          login: 'maria@clinica.com',
          password: 'senha123',
          role: 'atendente',
          clinic_id: 'clinic-1',
        })
      ).rejects.toThrow('Este email já está em uso');
    });
  });

  describe('validateCredentials', () => {
    it('should validate correct credentials', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        name: 'João Silva',
        login: 'joao@clinica.com',
        role: 'atendente',
        clinic_id: 'clinic-1',
        status: 'active',
        password_hash: 'hashed-password',
        clinic: { id: 'clinic-1', name: 'Clínica Teste' },
      };

      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUser,
          error: null,
        }),
      };

      mockSupabase.from().select.mockReturnValue(mockChain);
      mockBcrypt.compare.mockResolvedValue(true);

      // Act
      const result = await userService.validateCredentials('joao@clinica.com', 'senha123');

      // Assert
      expect(result).toEqual({
        id: '1',
        name: 'João Silva',
        login: 'joao@clinica.com',
        role: 'atendente',
        clinic_id: 'clinic-1',
        status: 'active',
        clinic: { id: 'clinic-1', name: 'Clínica Teste' },
      });
    });

    it('should return null for incorrect password', async () => {
      // Arrange
      const mockUser = {
        id: '1',
        name: 'João Silva',
        login: 'joao@clinica.com',
        password_hash: 'hashed-password',
        status: 'active',
      };

      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUser,
          error: null,
        }),
      };

      mockSupabase.from().select.mockReturnValue(mockChain);
      mockBcrypt.compare.mockResolvedValue(false);

      // Act
      const result = await userService.validateCredentials('joao@clinica.com', 'wrong-password');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      // Arrange
      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };

      mockSupabase.from().select.mockReturnValue(mockChain);

      // Act
      const result = await userService.validateCredentials('nonexistent@email.com', 'password');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Arrange
      const mockUser = {
        password_hash: 'old-hashed-password',
      };

      mockSupabase.from().select.mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUser,
          error: null,
        }),
      });

      mockSupabase.from().update.mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      });

      mockBcrypt.compare.mockResolvedValue(true);
      mockBcrypt.hash.mockResolvedValue('new-hashed-password');

      // Act & Assert
      await expect(
        userService.changePassword('1', 'old-password', 'new-password')
      ).resolves.toBeUndefined();

      expect(mockBcrypt.compare).toHaveBeenCalledWith('old-password', 'old-hashed-password');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('new-password', 12);
    });

    it('should validate new password length', async () => {
      // Act & Assert
      await expect(
        userService.changePassword('1', 'old-password', '123')
      ).rejects.toThrow('Nova senha deve ter pelo menos 6 caracteres');
    });

    it('should validate current password', async () => {
      // Arrange
      const mockUser = {
        password_hash: 'old-hashed-password',
      };

      mockSupabase.from().select.mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUser,
          error: null,
        }),
      });

      mockBcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      await expect(
        userService.changePassword('1', 'wrong-password', 'new-password')
      ).rejects.toThrow('Senha atual incorreta');
    });
  });

  describe('getUsersByClinic', () => {
    it('should get users by clinic', async () => {
      // Arrange
      const mockUsers = [
        {
          id: '1',
          name: 'João Silva',
          clinic_id: 'clinic-1',
          status: 'active',
        },
        {
          id: '2',
          name: 'Maria Santos',
          clinic_id: 'clinic-1',
          status: 'active',
        },
      ];

      const mockChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockUsers,
          error: null,
        }),
      };

      mockSupabase.from().select.mockReturnValue(mockChain);

      // Act
      const result = await userService.getUsersByClinic('clinic-1');

      // Assert
      expect(result).toEqual(mockUsers);
      expect(mockChain.eq).toHaveBeenCalledWith('clinic_id', 'clinic-1');
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'active');
    });
  });

  describe('getActiveUserCount', () => {
    it('should return active user count', async () => {
      // Arrange
      const mockChain = {
        eq: vi.fn().mockReturnValue({
          then: vi.fn().mockResolvedValue({
            count: 10,
            error: null,
          }),
        }),
      };

      mockSupabase.from().select.mockReturnValue(mockChain);

      // Act
      const result = await userService.getActiveUserCount();

      // Assert
      expect(result).toBe(10);
    });

    it('should filter by clinic when provided', async () => {
      // Arrange
      const mockChain = {
        eq: vi.fn().mockReturnThis(),
      };

      mockChain.eq.mockReturnValue({
        then: vi.fn().mockResolvedValue({
          count: 5,
          error: null,
        }),
      });

      mockSupabase.from().select.mockReturnValue(mockChain);

      // Act
      const result = await userService.getActiveUserCount('clinic-1');

      // Assert
      expect(result).toBe(5);
      expect(mockChain.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockChain.eq).toHaveBeenCalledWith('clinic_id', 'clinic-1');
    });
  });
});
