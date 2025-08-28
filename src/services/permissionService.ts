// =====================================================
// SERVIÇO DE PERMISSÕES - ATENDEAÍ 2.0
// =====================================================

import { supabase } from '@/integrations/supabase/client';

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions_json: Record<string, any>;
}

export interface UserClinicRelation {
  id: string;
  user_id: string;
  clinic_id: string;
  role_id: string;
  is_active: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  status: string;
}

class PermissionService {
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutos

  // Verificar se usuário tem role específico
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    try {
      const cacheKey = `role_${userId}_${roleName}`;
      const cached = this.getCached(cacheKey);
      if (cached !== null) return cached;

      const { data, error } = await supabase
        .from('user_clinic_relations')
        .select(`
          role_id,
          user_roles!inner(name)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('user_roles.name', roleName)
        .single();

      if (error) {
        console.error('Error checking role:', error);
        return false;
      }

      const hasRole = !!data;
      this.setCached(cacheKey, hasRole);
      return hasRole;
    } catch (error) {
      console.error('Error in hasRole:', error);
      return false;
    }
  }

  // Verificar se usuário tem role específico em uma clínica específica
  async hasRoleInClinic(userId: string, roleName: string, clinicId: string): Promise<boolean> {
    try {
      const cacheKey = `role_clinic_${userId}_${roleName}_${clinicId}`;
      const cached = this.getCached(cacheKey);
      if (cached !== null) return cached;

      const { data, error } = await supabase
        .from('user_clinic_relations')
        .select(`
          role_id,
          user_roles!inner(name)
        `)
        .eq('user_id', userId)
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .eq('user_roles.name', roleName)
        .single();

      if (error) {
        console.error('Error checking role in clinic:', error);
        return false;
      }

      const hasRole = !!data;
      this.setCached(cacheKey, hasRole);
      return hasRole;
    } catch (error) {
      console.error('Error in hasRoleInClinic:', error);
      return false;
    }
  }

  // Verificar se usuário tem qualquer um dos roles
  async hasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
    try {
      const cacheKey = `any_role_${userId}_${roleNames.sort().join('_')}`;
      const cached = this.getCached(cacheKey);
      if (cached !== null) return cached;

      const { data, error } = await supabase
        .from('user_clinic_relations')
        .select(`
          role_id,
          user_roles!inner(name)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .in('user_roles.name', roleNames)
        .limit(1);

      if (error) {
        console.error('Error checking any role:', error);
        return false;
      }

      const hasAnyRole = data && data.length > 0;
      this.setCached(cacheKey, hasAnyRole);
      return hasAnyRole;
    } catch (error) {
      console.error('Error in hasAnyRole:', error);
      return false;
    }
  }

  // Verificar se usuário tem todos os roles
  async hasAllRoles(userId: string, roleNames: string[]): Promise<boolean> {
    try {
      const cacheKey = `all_roles_${userId}_${roleNames.sort().join('_')}`;
      const cached = this.getCached(cacheKey);
      if (cached !== null) return cached;

      const { data, error } = await supabase
        .from('user_clinic_relations')
        .select(`
          role_id,
          user_roles!inner(name)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .in('user_roles.name', roleNames);

      if (error) {
        console.error('Error checking all roles:', error);
        return false;
      }

      const hasAllRoles = data && data.length === roleNames.length;
      this.setCached(cacheKey, hasAllRoles);
      return hasAllRoles;
    } catch (error) {
      console.error('Error in hasAllRoles:', error);
      return false;
    }
  }

  // Verificar se é admin Lify
  async isAdminLify(userId: string): Promise<boolean> {
    return this.hasRole(userId, 'admin_lify');
  }

  // Verificar se é admin de clínica
  async isAdminClinic(userId: string): Promise<boolean> {
    return this.hasRole(userId, 'admin_clinic');
  }

  // Verificar se é atendente
  async isAttendant(userId: string): Promise<boolean> {
    return this.hasRole(userId, 'attendant');
  }

  // Obter clínicas do usuário
  async getUserClinics(userId: string): Promise<string[]> {
    try {
      const cacheKey = `clinics_${userId}`;
      const cached = this.getCached(cacheKey);
      if (cached !== null) return cached;

      const { data, error } = await supabase
        .from('user_clinic_relations')
        .select('clinic_id')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error getting user clinics:', error);
        return [];
      }

      const clinicIds = data?.map(relation => relation.clinic_id) || [];
      this.setCached(cacheKey, clinicIds);
      return clinicIds;
    } catch (error) {
      console.error('Error in getUserClinics:', error);
      return [];
    }
  }

  // Obter role do usuário em uma clínica específica
  async getUserRoleInClinic(userId: string, clinicId: string): Promise<string | null> {
    try {
      const cacheKey = `role_clinic_${userId}_${clinicId}`;
      const cached = this.getCached(cacheKey);
      if (cached !== null) return cached;

      const { data, error } = await supabase
        .from('user_clinic_relations')
        .select(`
          user_roles!inner(name)
        `)
        .eq('user_id', userId)
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error getting user role in clinic:', error);
        return null;
      }

      const roleName = data?.user_roles?.name || null;
      this.setCached(cacheKey, roleName);
      return roleName;
    } catch (error) {
      console.error('Error in getUserRoleInClinic:', error);
      return null;
    }
  }

  // Verificar se usuário pode acessar dados de uma clínica específica
  async canAccessClinicData(userId: string, clinicId: string): Promise<boolean> {
    try {
      const cacheKey = `access_clinic_${userId}_${clinicId}`;
      const cached = this.getCached(cacheKey);
      if (cached !== null) return cached;

      // Admin Lify pode acessar qualquer clínica
      const isAdminLify = await this.isAdminLify(userId);
      if (isAdminLify) {
        this.setCached(cacheKey, true);
        return true;
      }

      // Verificar se usuário tem relação ativa com a clínica
      const { data, error } = await supabase
        .from('user_clinic_relations')
        .select('id')
        .eq('user_id', userId)
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error checking clinic access:', error);
        return false;
      }

      const canAccess = !!data;
      this.setCached(cacheKey, canAccess);
      return canAccess;
    } catch (error) {
      console.error('Error in canAccessClinicData:', error);
      return false;
    }
  }

  // Obter clínicas que o usuário pode acessar
  async getAccessibleClinics(userId: string): Promise<string[]> {
    try {
      const cacheKey = `accessible_clinics_${userId}`;
      const cached = this.getCached(cacheKey);
      if (cached !== null) return cached;

      // Admin Lify pode acessar todas as clínicas
      const isAdminLify = await this.isAdminLify(userId);
      if (isAdminLify) {
        const { data: allClinics, error: clinicsError } = await supabase
          .from('clinics')
          .select('id')
          .eq('status', 'active');

        if (clinicsError) {
          console.error('Error fetching all clinics:', clinicsError);
          return [];
        }

        const clinicIds = allClinics?.map(clinic => clinic.id) || [];
        this.setCached(cacheKey, clinicIds);
        return clinicIds;
      }

      // Usuários normais só podem acessar suas clínicas
      const clinicIds = await this.getUserClinics(userId);
      this.setCached(cacheKey, clinicIds);
      return clinicIds;
    } catch (error) {
      console.error('Error in getAccessibleClinics:', error);
      return [];
    }
  }

  // Limpar cache
  clearCache(): void {
    this.cache.clear();
  }

  // Gerenciamento de cache
  private getCached(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }

  private setCached(key: string, value: any): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
}

// Instância singleton
export const permissionService = new PermissionService();
export default permissionService;
