import { supabase } from '@/integrations/supabase/client';

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  appointment_type: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  appointment_date: string;
  duration_minutes: number;
  notes?: string;
  google_event_id?: string;
  assigned_user_id?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreateAppointmentRequest {
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  appointment_type: string;
  appointment_date: string;
  duration_minutes?: number;
  notes?: string;
  assigned_user_id?: string;
}

export interface UpdateAppointmentRequest {
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  appointment_type?: string;
  status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  appointment_date?: string;
  duration_minutes?: number;
  notes?: string;
  assigned_user_id?: string;
}

export interface ListAppointmentsResponse {
  data: Appointment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface AppointmentStats {
  total: number;
  scheduled: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  today: number;
  this_week: number;
  this_month: number;
}

class AppointmentService {
  private readonly tableName = 'appointments';

  async list(params?: {
    page?: number;
    limit?: number;
    status?: string;
    appointment_type?: string;
    assigned_user_id?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
  }): Promise<ListAppointmentsResponse> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        appointment_type, 
        assigned_user_id, 
        date_from, 
        date_to, 
        search 
      } = params || {};
      
      const offset = (page - 1) * limit;

      let query = supabase
        .from(this.tableName)
        .select('*', { count: 'exact' });

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }

      if (appointment_type) {
        query = query.eq('appointment_type', appointment_type);
      }

      if (assigned_user_id) {
        query = query.eq('assigned_user_id', assigned_user_id);
      }

      if (date_from) {
        query = query.gte('appointment_date', date_from);
      }

      if (date_to) {
        query = query.lte('appointment_date', date_to);
      }

      if (search) {
        query = query.or(`patient_name.ilike.%${search}%,patient_phone.ilike.%${search}%,patient_email.ilike.%${search}%`);
      }

      // Apply pagination
      query = query
        .range(offset, offset + limit - 1)
        .order('appointment_date', { ascending: true });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Error fetching appointments: ${error.message}`);
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
      console.error('Error in appointmentService.list:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<Appointment> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Agendamento não encontrado');
        }
        throw new Error(`Error fetching appointment: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in appointmentService.getById:', error);
      throw error;
    }
  }

  async create(appointmentData: CreateAppointmentRequest): Promise<Appointment> {
    try {
      // Validate required fields
      if (!appointmentData.patient_name || !appointmentData.patient_phone || 
          !appointmentData.appointment_type || !appointmentData.appointment_date) {
        throw new Error('Nome do paciente, telefone, tipo e data do agendamento são obrigatórios');
      }

      // Validate appointment date is in the future
      const appointmentDate = new Date(appointmentData.appointment_date);
      const now = new Date();
      if (appointmentDate <= now) {
        throw new Error('Data do agendamento deve ser no futuro');
      }

      // Get current user from auth context
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const newAppointment = {
        patient_name: appointmentData.patient_name.trim(),
        patient_phone: appointmentData.patient_phone.trim(),
        patient_email: appointmentData.patient_email?.trim() || null,
        appointment_type: appointmentData.appointment_type,
        status: 'scheduled' as const,
        appointment_date: appointmentData.appointment_date,
        duration_minutes: appointmentData.duration_minutes || 30,
        notes: appointmentData.notes?.trim() || null,
        assigned_user_id: appointmentData.assigned_user_id || null,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert([newAppointment])
        .select()
        .single();

      if (error) {
        throw new Error(`Error creating appointment: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in appointmentService.create:', error);
      throw error;
    }
  }

  async update(id: string, appointmentData: UpdateAppointmentRequest): Promise<Appointment> {
    try {
      // Validate appointment date if provided
      if (appointmentData.appointment_date) {
        const appointmentDate = new Date(appointmentData.appointment_date);
        const now = new Date();
        if (appointmentDate <= now && appointmentData.status !== 'completed' && appointmentData.status !== 'cancelled') {
          throw new Error('Data do agendamento deve ser no futuro');
        }
      }

      const updateData = {
        ...(appointmentData.patient_name && { patient_name: appointmentData.patient_name.trim() }),
        ...(appointmentData.patient_phone && { patient_phone: appointmentData.patient_phone.trim() }),
        ...(appointmentData.patient_email !== undefined && { 
          patient_email: appointmentData.patient_email?.trim() || null 
        }),
        ...(appointmentData.appointment_type && { appointment_type: appointmentData.appointment_type }),
        ...(appointmentData.status && { status: appointmentData.status }),
        ...(appointmentData.appointment_date && { appointment_date: appointmentData.appointment_date }),
        ...(appointmentData.duration_minutes && { duration_minutes: appointmentData.duration_minutes }),
        ...(appointmentData.notes !== undefined && { notes: appointmentData.notes?.trim() || null }),
        ...(appointmentData.assigned_user_id !== undefined && { assigned_user_id: appointmentData.assigned_user_id }),
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
          throw new Error('Agendamento não encontrado');
        }
        throw new Error(`Error updating appointment: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in appointmentService.update:', error);
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
          throw new Error('Agendamento não encontrado');
        }
        throw new Error(`Error deleting appointment: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in appointmentService.delete:', error);
      throw error;
    }
  }

  async getStats(params?: {
    date_from?: string;
    date_to?: string;
    assigned_user_id?: string;
  }): Promise<AppointmentStats> {
    try {
      const { date_from, date_to, assigned_user_id } = params || {};

      let query = supabase
        .from(this.tableName)
        .select('status, appointment_date', { count: 'exact' });

      if (date_from) {
        query = query.gte('appointment_date', date_from);
      }

      if (date_to) {
        query = query.lte('appointment_date', date_to);
      }

      if (assigned_user_id) {
        query = query.eq('assigned_user_id', assigned_user_id);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Error fetching appointment stats: ${error.message}`);
      }

      const appointments = data || [];
      const total = count || 0;

      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats: AppointmentStats = {
        total,
        scheduled: appointments.filter(a => a.status === 'scheduled').length,
        confirmed: appointments.filter(a => a.status === 'confirmed').length,
        completed: appointments.filter(a => a.status === 'completed').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
        today: appointments.filter(a => {
          const apptDate = new Date(a.appointment_date);
          return apptDate >= today && apptDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        }).length,
        this_week: appointments.filter(a => {
          const apptDate = new Date(a.appointment_date);
          return apptDate >= startOfWeek;
        }).length,
        this_month: appointments.filter(a => {
          const apptDate = new Date(a.appointment_date);
          return apptDate >= startOfMonth;
        }).length
      };

      return stats;
    } catch (error) {
      console.error('Error in appointmentService.getStats:', error);
      throw error;
    }
  }

  async getUpcoming(limit = 10, userId?: string): Promise<Appointment[]> {
    try {
      const now = new Date().toISOString();

      let query = supabase
        .from(this.tableName)
        .select('*')
        .gte('appointment_date', now)
        .in('status', ['scheduled', 'confirmed'])
        .order('appointment_date', { ascending: true })
        .limit(limit);

      if (userId) {
        query = query.eq('assigned_user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Error fetching upcoming appointments: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in appointmentService.getUpcoming:', error);
      throw error;
    }
  }

  async checkAvailability(date: string, duration = 30, excludeId?: string): Promise<boolean> {
    try {
      const startTime = new Date(date);
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      let query = supabase
        .from(this.tableName)
        .select('id')
        .gte('appointment_date', startTime.toISOString())
        .lt('appointment_date', endTime.toISOString())
        .in('status', ['scheduled', 'confirmed', 'in_progress']);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Error checking availability: ${error.message}`);
      }

      return (data || []).length === 0;
    } catch (error) {
      console.error('Error in appointmentService.checkAvailability:', error);
      throw error;
    }
  }

  async getByPatientPhone(phone: string): Promise<Appointment[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('patient_phone', phone.trim())
        .order('appointment_date', { ascending: false });

      if (error) {
        throw new Error(`Error fetching appointments by phone: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in appointmentService.getByPatientPhone:', error);
      throw error;
    }
  }

  async updateStatus(id: string, status: Appointment['status'], notes?: string): Promise<Appointment> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.notes = notes.trim();
      }

      // Set completion timestamp for completed appointments
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Agendamento não encontrado');
        }
        throw new Error(`Error updating appointment status: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in appointmentService.updateStatus:', error);
      throw error;
    }
  }

  async linkGoogleEvent(appointmentId: string, googleEventId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({
          google_event_id: googleEventId,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) {
        throw new Error(`Error linking Google event: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in appointmentService.linkGoogleEvent:', error);
      throw error;
    }
  }

  formatAppointmentForDisplay(appointment: Appointment): {
    title: string;
    subtitle: string;
    time: string;
    date: string;
    duration: string;
    statusLabel: string;
    statusColor: string;
  } {
    const date = new Date(appointment.appointment_date);
    const endDate = new Date(date.getTime() + appointment.duration_minutes * 60 * 1000);

    const statusLabels = {
      scheduled: 'Agendado',
      confirmed: 'Confirmado',
      in_progress: 'Em andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      no_show: 'Não compareceu'
    };

    const statusColors = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-red-100 text-red-800'
    };

    return {
      title: appointment.patient_name,
      subtitle: `${appointment.appointment_type} • ${appointment.patient_phone}`,
      time: `${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      date: date.toLocaleDateString('pt-BR'),
      duration: `${appointment.duration_minutes}min`,
      statusLabel: statusLabels[appointment.status],
      statusColor: statusColors[appointment.status]
    };
  }
}

export const appointmentService = new AppointmentService();
