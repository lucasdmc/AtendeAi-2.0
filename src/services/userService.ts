// =====================================================
// SERVIÇO DE GESTÃO DE USUÁRIOS - ATENDEAÍ 2.0
// =====================================================

import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface UserWithRole extends User {
  role_name: string;
  clinic_name: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  role_id: string;
  clinic_id: string;
}

export interface UpdateUserData {
  full_name?: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

class UserService {
  private baseURL = 'http://localhost:3002/api/v1';

  // Obter todos os usuários (com filtros)
  async getUsers(filters?: {
    clinic_id?: string;
    role_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<UserWithRole[]> {
    try {
      let query = supabase
        .from('user_clinic_relations')
        .select(`
          *,
          users!inner(*),
          user_roles!inner(name),
          clinics!inner(name)
        `)
        .eq('is_active', true);

      if (filters?.clinic_id) {
        query = query.eq('clinic_id', filters.clinic_id);
      }

      if (filters?.role_id) {
        query = query.eq('role_id', filters.role_id);
      }

      if (filters?.status) {
        query = query.eq('users.status', filters.status);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Error fetching users: ${error.message}`);
      }

      return data?.map(relation => ({
        id: relation.users.id,
        email: relation.users.email,
        full_name: relation.users.full_name,
        phone: relation.users.phone,
        status: relation.users.status,
        created_at: relation.users.created_at,
        updated_at: relation.users.updated_at,
        role_name: relation.user_roles.name,
        clinic_name: relation.clinics.name
      })) || [];
    } catch (error) {
      console.error('Error in getUsers:', error);
      throw error;
    }
  }

  // Obter usuário específico
  async getUser(userId: string): Promise<UserWithRole | null> {
    try {
      const { data, error } = await supabase
        .from('user_clinic_relations')
        .select(`
          *,
          users!inner(*),
          user_roles!inner(name),
          clinics!inner(name)
        `)
        .eq('users.id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw new Error(`Error fetching user: ${error.message}`);
      }

      return {
        id: data.users.id,
        email: data.users.email,
        full_name: data.users.full_name,
        phone: data.users.phone,
        status: data.users.status,
        created_at: data.users.created_at,
        updated_at: data.users.updated_at,
        role_name: data.user_roles.name,
        clinic_name: data.clinics.name
      };
    } catch (error) {
      console.error('Error in getUser:', error);
      throw error;
    }
  }

  // Criar novo usuário
  async createUser(userData: CreateUserData): Promise<User> {
    try {
      // Primeiro, criar o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: {
          full_name: userData.full_name,
          phone: userData.phone
        }
      });

      if (authError) {
        throw new Error(`Error creating auth user: ${authError.message}`);
      }

      // Depois, criar o usuário no banco de dados
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          phone: userData.phone,
          status: 'active'
        })
        .select()
        .single();

      if (userError) {
        throw new Error(`Error creating user record: ${userError.message}`);
      }

      // Por fim, criar a relação usuário-clínica-role
      const { error: relationError } = await supabase
        .from('user_clinic_relations')
        .insert({
          user_id: authData.user.id,
          clinic_id: userData.clinic_id,
          role_id: userData.role_id,
          is_active: true
        });

      if (relationError) {
        throw new Error(`Error creating user-clinic relation: ${relationError.message}`);
      }

      return userRecord;
    } catch (error) {
      console.error('Error in createUser:', error);
      throw error;
    }
  }

  // Atualizar usuário
  async updateUser(userId: string, updateData: UpdateUserData): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Error updating user: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  }

  // Desativar usuário
  async deactivateUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_clinic_relations')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Error deactivating user: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in deactivateUser:', error);
      throw error;
    }
  }

  // Reativar usuário
  async reactivateUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_clinic_relations')
        .update({ is_active: true })
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Error reactivating user: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in reactivateUser:', error);
      throw error;
    }
  }

  // Alterar role do usuário
  async changeUserRole(userId: string, clinicId: string, newRoleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_clinic_relations')
        .update({ role_id: newRoleId })
        .eq('user_id', userId)
        .eq('clinic_id', clinicId);

      if (error) {
        throw new Error(`Error changing user role: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in changeUserRole:', error);
      throw error;
    }
  }

  // Obter usuários por clínica
  async getUsersByClinic(clinicId: string): Promise<UserWithRole[]> {
    return this.getUsers({ clinic_id: clinicId });
  }

  // Obter usuários por role
  async getUsersByRole(roleId: string): Promise<UserWithRole[]> {
    return this.getUsers({ role_id: roleId });
  }
}

// Instância singleton
export const userService = new UserService();
export default userService;
