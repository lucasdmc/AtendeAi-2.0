import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  login: string;
  role: 'admin_lify' | 'suporte_lify' | 'atendente' | 'gestor' | 'administrador';
  clinic_id: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  clinic?: {
    id: string;
    name: string;
  };
}

export interface CreateUserRequest {
  name: string;
  login: string;
  password: string;
  role: 'admin_lify' | 'suporte_lify' | 'atendente' | 'gestor' | 'administrador';
  clinic_id: string;
  status?: 'active' | 'inactive';
}

export interface UpdateUserRequest {
  name?: string;
  login?: string;
  password?: string;
  role?: 'admin_lify' | 'suporte_lify' | 'atendente' | 'gestor' | 'administrador';
  clinic_id?: string;
  status?: 'active' | 'inactive';
}

export interface ListUsersResponse {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

class UserService {
  private readonly tableName = 'users';

  async list(params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    clinic_id?: string;
    search?: string;
  }): Promise<ListUsersResponse> {
    try {
      const { page = 1, limit = 20, role, status, clinic_id, search } = params || {};
      const offset = (page - 1) * limit;

      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          clinic:clinics(id, name)
        `, { count: 'exact' });

      // Apply filters
      if (role) {
        query = query.eq('role', role);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (clinic_id) {
        query = query.eq('clinic_id', clinic_id);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,login.ilike.%${search}%`);
      }

      // Apply pagination
      query = query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Error fetching users: ${error.message}`);
      }

      const total = count || 0;
      const pages = Math.ceil(total / limit);

      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total,
          pages,
          has_next: page < pages,
          has_prev: page > 1
        }
      };
    } catch (error) {
      console.error('Error in userService.list:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<User> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          clinic:clinics(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Usuário não encontrado');
        }
        throw new Error(`Error fetching user: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in userService.getById:', error);
      throw error;
    }
  }

  async create(userData: CreateUserRequest): Promise<User> {
    try {
      // Validate required fields
      if (!userData.name || !userData.login || !userData.password || !userData.role || !userData.clinic_id) {
        throw new Error('Todos os campos obrigatórios devem ser preenchidos');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.login)) {
        throw new Error('Formato de email inválido');
      }

      // Validate password length
      if (userData.password.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const newUser = {
        name: userData.name.trim(),
        login: userData.login.toLowerCase().trim(),
        password_hash: hashedPassword,
        role: userData.role,
        clinic_id: userData.clinic_id,
        status: userData.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert([newUser])
        .select(`
          *,
          clinic:clinics(id, name)
        `)
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Este email já está em uso');
        }
        throw new Error(`Error creating user: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in userService.create:', error);
      throw error;
    }
  }

  async update(id: string, userData: UpdateUserRequest): Promise<User> {
    try {
      // Validate email format if provided
      if (userData.login) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.login)) {
          throw new Error('Formato de email inválido');
        }
      }

      // Validate password length if provided
      if (userData.password && userData.password.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres');
      }

      const updateData: any = {
        ...(userData.name && { name: userData.name.trim() }),
        ...(userData.login && { login: userData.login.toLowerCase().trim() }),
        ...(userData.role && { role: userData.role }),
        ...(userData.clinic_id && { clinic_id: userData.clinic_id }),
        ...(userData.status && { status: userData.status }),
        updated_at: new Date().toISOString()
      };

      // Hash password if provided
      if (userData.password) {
        updateData.password_hash = await bcrypt.hash(userData.password, 12);
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          clinic:clinics(id, name)
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Usuário não encontrado');
        }
        if (error.code === '23505') {
          throw new Error('Este email já está em uso');
        }
        throw new Error(`Error updating user: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in userService.update:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Usuário não encontrado');
        }
        throw new Error(`Error deleting user: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in userService.delete:', error);
      throw error;
    }
  }

  async validateCredentials(login: string, password: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          clinic:clinics(id, name)
        `)
        .eq('login', login.toLowerCase().trim())
        .eq('status', 'active')
        .single();

      if (error || !data) {
        return null;
      }

      const isValidPassword = await bcrypt.compare(password, data.password_hash);
      if (!isValidPassword) {
        return null;
      }

      // Remove password_hash from response
      const { password_hash, ...userWithoutPassword } = data;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error in userService.validateCredentials:', error);
      return null;
    }
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Validate new password length
      if (newPassword.length < 6) {
        throw new Error('Nova senha deve ter pelo menos 6 caracteres');
      }

      // Get current user
      const { data: user, error: fetchError } = await supabase
        .from(this.tableName)
        .select('password_hash')
        .eq('id', id)
        .single();

      if (fetchError || !user) {
        throw new Error('Usuário não encontrado');
      }

      // Validate current password
      const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidCurrentPassword) {
        throw new Error('Senha atual incorreta');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      const { error: updateError } = await supabase
        .from(this.tableName)
        .update({
          password_hash: hashedNewPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        throw new Error(`Error updating password: ${updateError.message}`);
      }
    } catch (error) {
      console.error('Error in userService.changePassword:', error);
      throw error;
    }
  }

  async getUsersByClinic(clinicId: string): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select(`
          *,
          clinic:clinics(id, name)
        `)
        .eq('clinic_id', clinicId)
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) {
        throw new Error(`Error fetching users by clinic: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in userService.getUsersByClinic:', error);
      throw error;
    }
  }

  async getUsersByRole(role: string, clinicId?: string): Promise<User[]> {
    try {
      let query = supabase
        .from(this.tableName)
        .select(`
          *,
          clinic:clinics(id, name)
        `)
        .eq('role', role)
        .eq('status', 'active');

      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) {
        throw new Error(`Error fetching users by role: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in userService.getUsersByRole:', error);
      throw error;
    }
  }

  async validateEmail(email: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('id')
        .eq('login', email.toLowerCase().trim());

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Error validating email: ${error.message}`);
      }

      return (data || []).length === 0;
    } catch (error) {
      console.error('Error in userService.validateEmail:', error);
      throw error;
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Error updating last login: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in userService.updateLastLogin:', error);
      throw error;
    }
  }

  async getActiveUserCount(clinicId?: string): Promise<number> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Error counting active users: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('Error in userService.getActiveUserCount:', error);
      throw error;
    }
  }
}

export const userService = new UserService();