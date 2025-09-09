import { supabase } from '@/integrations/supabase/client';

export interface Clinic {
  id: string;
  name: string;
  whatsapp_number: string;
  meta_webhook_url?: string;
  whatsapp_id?: string;
  context_json: Record<string, any>;
  simulation_mode: boolean;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CreateClinicRequest {
  name: string;
  whatsapp_number: string;
  meta_webhook_url?: string;
  whatsapp_id?: string;
  context_json: Record<string, any>;
  simulation_mode?: boolean;
}

export interface UpdateClinicRequest {
  name?: string;
  whatsapp_number?: string;
  meta_webhook_url?: string;
  whatsapp_id?: string;
  context_json?: Record<string, any>;
  simulation_mode?: boolean;
}

export interface ListClinicsResponse {
  data: Clinic[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

class ClinicService {
  private readonly tableName = 'clinics';

  async list(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<ListClinicsResponse> {
    try {
      const { page = 1, limit = 20, status, search } = params || {};
      const offset = (page - 1) * limit;

      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact' });

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,whatsapp_number.ilike.%${search}%`);
      }

      // Apply pagination
      query = query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Error fetching clinics: ${error.message}`);
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
      console.error('Error in clinicService.list:', error);
      throw error;
    }
  }

  async getClinic(id: string): Promise<Clinic> {
    return this.getById(id);
  }

  async getById(id: string): Promise<Clinic> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Clínica não encontrada');
        }
        throw new Error(`Error fetching clinic: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in clinicService.getById:', error);
      throw error;
    }
  }

  async create(clinicData: CreateClinicRequest): Promise<Clinic> {
    try {
      // Validate required fields
      if (!clinicData.name || !clinicData.whatsapp_number || !clinicData.context_json) {
        throw new Error('Nome, número WhatsApp e JSON de contextualização são obrigatórios');
      }

      // Validate WhatsApp number format
      const whatsappRegex = /^\+[1-9]\d{1,14}$/;
      if (!whatsappRegex.test(clinicData.whatsapp_number)) {
        throw new Error('Formato do número WhatsApp inválido (use +5511999999999)');
      }

      const newClinic = {
        name: clinicData.name.trim(),
        whatsapp_number: clinicData.whatsapp_number.trim(),
        meta_webhook_url: clinicData.meta_webhook_url?.trim() || null,
        whatsapp_id: clinicData.whatsapp_id?.trim() || null,
        context_json: clinicData.context_json,
        simulation_mode: clinicData.simulation_mode || false,
        status: 'active' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert([newClinic])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Número WhatsApp já está em uso por outra clínica');
        }
        throw new Error(`Error creating clinic: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in clinicService.create:', error);
      throw error;
    }
  }

  async update(id: string, clinicData: UpdateClinicRequest): Promise<Clinic> {
    try {
      // Validate WhatsApp number format if provided
      if (clinicData.whatsapp_number) {
        const whatsappRegex = /^\+[1-9]\d{1,14}$/;
        if (!whatsappRegex.test(clinicData.whatsapp_number)) {
          throw new Error('Formato do número WhatsApp inválido (use +5511999999999)');
        }
      }

      const updateData = {
        ...(clinicData.name && { name: clinicData.name.trim() }),
        ...(clinicData.whatsapp_number && { whatsapp_number: clinicData.whatsapp_number.trim() }),
        ...(clinicData.meta_webhook_url !== undefined && { 
          meta_webhook_url: clinicData.meta_webhook_url?.trim() || null 
        }),
        ...(clinicData.whatsapp_id !== undefined && { 
          whatsapp_id: clinicData.whatsapp_id?.trim() || null 
        }),
        ...(clinicData.context_json && { context_json: clinicData.context_json }),
        ...(clinicData.simulation_mode !== undefined && { simulation_mode: clinicData.simulation_mode }),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Clínica não encontrada');
        }
        if (error.code === '23505') {
          throw new Error('Número WhatsApp já está em uso por outra clínica');
        }
        throw new Error(`Error updating clinic: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in clinicService.update:', error);
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
          throw new Error('Clínica não encontrada');
        }
        throw new Error(`Error deleting clinic: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in clinicService.delete:', error);
      throw error;
    }
  }

  async getContext(id: string): Promise<Record<string, any>> {
    try {
      const clinic = await this.getById(id);
      return this.generateContextReport(clinic.context_json);
    } catch (error) {
      console.error('Error in clinicService.getContext:', error);
      throw error;
    }
  }

  private generateContextReport(contextJson: Record<string, any>): Record<string, any> {
    const report: Record<string, any> = {
      clinic_info: {},
      ai_agent_config: {},
      business_hours: {},
      appointment_types: [],
      professionals: []
    };

    // Extract clinic information
    if (contextJson.clinica?.informacoes_basicas) {
      report.clinic_info = contextJson.clinica.informacoes_basicas;
    }

    // Extract AI agent configuration
    if (contextJson.agente_ia) {
      report.ai_agent_config = contextJson.agente_ia;
    }

    // Extract business hours
    if (contextJson.horario_funcionamento) {
      report.business_hours = contextJson.horario_funcionamento;
    }

    // Extract appointment types
    if (contextJson.agendamento_config?.tipos_agendamento) {
      report.appointment_types = contextJson.agendamento_config.tipos_agendamento;
    }

    // Extract professionals
    if (contextJson.profissionais) {
      report.professionals = contextJson.profissionais;
    }

    return report;
  }

  async validateWhatsAppNumber(whatsappNumber: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from(this.tableName)
        .select('id')
        .eq('whatsapp_number', whatsappNumber);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Error validating WhatsApp number: ${error.message}`);
      }

      return (data || []).length === 0;
    } catch (error) {
      console.error('Error in clinicService.validateWhatsAppNumber:', error);
      throw error;
    }
  }

  async toggleSimulationMode(id: string, simulationMode: boolean): Promise<Clinic> {
    try {
      return await this.update(id, { simulation_mode: simulationMode });
    } catch (error) {
      console.error('Error in clinicService.toggleSimulationMode:', error);
      throw error;
    }
  }

  async getActiveClinicCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (error) {
        throw new Error(`Error counting active clinics: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('Error in clinicService.getActiveClinicCount:', error);
      throw error;
    }
  }
}

export const clinicService = new ClinicService();