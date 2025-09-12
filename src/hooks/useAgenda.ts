import { useState, useMemo, useEffect } from 'react';
import { Agendamento, AgendaFlag, AgendaView } from '@/types/agenda';
import { addDays, startOfWeek, format, isSameDay, isSameMonth, isSameYear, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointments } from '@/hooks/useApi';
import { useClinic as useClinicContext } from '@/contexts/ClinicContext';

// Default flags - serão carregadas do backend
const defaultFlags: AgendaFlag[] = [
  { id: '1', name: 'Consulta Regular', color: 'text-blue-700', backgroundColor: 'bg-blue-100' },
  { id: '2', name: 'Urgência', color: 'text-red-700', backgroundColor: 'bg-red-100' },
  { id: '3', name: 'Retorno', color: 'text-green-700', backgroundColor: 'bg-green-100' },
  { id: '4', name: 'Exame', color: 'text-purple-700', backgroundColor: 'bg-purple-100' },
];

export const useAgenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<AgendaView>('semana');
  const [flags, setFlags] = useState<AgendaFlag[]>(defaultFlags);
  
  // Contexto da clínica
  const { selectedClinic } = useClinicContext();
  
  // Dados do backend
  const { data: appointmentsData, loading: appointmentsLoading, error: appointmentsError, refetch: refetchAppointments } = useAppointments(selectedClinic?.id);
  
  // Converter dados do backend para o formato local
  const agendamentos = useMemo(() => {
    if (!appointmentsData?.data) return [];
    
    return appointmentsData.data.map((appointment: any) => ({
      id: appointment.id,
      paciente_nome: appointment.patient_name || appointment.customer_info?.name || 'Paciente',
      data_consulta: new Date(appointment.datetime),
      horario_inicio: format(new Date(appointment.datetime), 'HH:mm'),
      horario_fim: format(new Date(new Date(appointment.datetime).getTime() + appointment.duration * 60000), 'HH:mm'),
      flag_id: appointment.appointment_type || '1', // Usar appointment_type como flag_id
      status: appointment.status,
      created_at: new Date(appointment.created_at),
      updated_at: new Date(appointment.updated_at),
    }));
  }, [appointmentsData]);

  // Dados para visualização da semana
  const weekData = useMemo(() => {
    const startWeek = startOfWeek(currentDate, { locale: ptBR });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startWeek, i));
    
    return weekDays.map(day => ({
      date: day,
      agendamentos: agendamentos.filter(agendamento => 
        isSameDay(agendamento.data_consulta, day)
      ).sort((a, b) => a.horario_inicio.localeCompare(b.horario_inicio))
    }));
  }, [currentDate, agendamentos]);

  // Dados para visualização do mês
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startCalendar = startOfWeek(firstDay, { locale: ptBR });
    const daysToShow = Math.ceil(differenceInDays(lastDay, startCalendar) / 7) * 7;
    
    return Array.from({ length: daysToShow }, (_, i) => {
      const day = addDays(startCalendar, i);
      const dayAgendamentos = agendamentos.filter(agendamento => 
        isSameDay(agendamento.data_consulta, day)
      );
      
      return {
        date: day,
        isCurrentMonth: isSameMonth(day, currentDate),
        agendamentosCount: dayAgendamentos.length,
        agendamentos: dayAgendamentos
      };
    });
  }, [currentDate, agendamentos]);

  // Dados para visualização do ano
  const yearData = useMemo(() => {
    const year = currentDate.getFullYear();
    
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const monthDate = new Date(year, monthIndex, 1);
      const monthAgendamentos = agendamentos.filter(agendamento => 
        isSameMonth(agendamento.data_consulta, monthDate) && 
        isSameYear(agendamento.data_consulta, monthDate)
      );
      
      // Calcular % de crescimento comparado ao mês anterior
      const previousMonth = new Date(year, monthIndex - 1, 1);
      const previousMonthAgendamentos = agendamentos.filter(agendamento => 
        isSameMonth(agendamento.data_consulta, previousMonth) && 
        isSameYear(agendamento.data_consulta, previousMonth)
      );
      
      const currentCount = monthAgendamentos.length;
      const previousCount = previousMonthAgendamentos.length;
      const growth = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0;
      
      return {
        month: monthIndex,
        name: format(monthDate, 'MMM', { locale: ptBR }),
        agendamentosCount: currentCount,
        growth: growth,
        date: monthDate
      };
    });
  }, [currentDate, agendamentos]);

  const addAgendamento = async (agendamento: Omit<Agendamento, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
    try {
      if (!selectedClinic?.id) {
        throw new Error('Clínica não selecionada');
      }

      // Calcular duração baseada nos horários
      const inicio = new Date(`2000-01-01T${agendamento.horario_inicio}`);
      const fim = new Date(`2000-01-01T${agendamento.horario_fim}`);
      const duration = Math.round((fim.getTime() - inicio.getTime()) / 60000); // em minutos

      const appointmentData = {
        clinic_id: selectedClinic.id,
        customer_info: {
          name: agendamento.paciente_nome,
        },
        appointment_type: agendamento.flag_id,
        datetime: agendamento.data_consulta.toISOString(),
        duration: duration,
        status: 'scheduled',
      };

      // Usar a API real de agendamentos
      const { appointmentApi } = await import('@/services/api');
      await appointmentApi.createAppointment(appointmentData);
      
      // Refetch dos dados do backend
      await refetchAppointments();
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      throw error;
    }
  };

  const updateAgendamento = async (id: string, updates: Partial<Agendamento>) => {
    try {
      const updateData: any = {};
      
      if (updates.paciente_nome) {
        updateData.customer_info = { name: updates.paciente_nome };
      }
      if (updates.data_consulta) {
        updateData.datetime = updates.data_consulta.toISOString();
      }
      if (updates.flag_id) {
        updateData.appointment_type = updates.flag_id;
      }
      if (updates.status) {
        updateData.status = updates.status;
      }

      // Usar a API real de agendamentos
      const { appointmentApi } = await import('@/services/api');
      await appointmentApi.updateAppointment(id, updateData);
      
      // Refetch dos dados do backend
      await refetchAppointments();
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      throw error;
    }
  };

  const deleteAgendamento = async (id: string) => {
    try {
      // Usar a API real de agendamentos
      const { appointmentApi } = await import('@/services/api');
      await appointmentApi.deleteAppointment(id);
      
      // Refetch dos dados do backend
      await refetchAppointments();
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      throw error;
    }
  };

  const addFlag = (flag: Omit<AgendaFlag, 'id'>) => {
    const newFlag: AgendaFlag = {
      ...flag,
      id: Date.now().toString(),
    };
    setFlags(prev => [...prev, newFlag]);
  };

  const updateFlag = (id: string, updates: Partial<AgendaFlag>) => {
    setFlags(prev => prev.map(flag => 
      flag.id === id ? { ...flag, ...updates } : flag
    ));
  };

  const deleteFlag = (id: string) => {
    setFlags(prev => prev.filter(flag => flag.id !== id));
  };

  const getFlagById = (id: string) => flags.find(flag => flag.id === id);

  return {
    currentDate,
    setCurrentDate,
    view,
    setView,
    weekData,
    monthData,
    yearData,
    agendamentos,
    flags,
    addAgendamento,
    updateAgendamento,
    deleteAgendamento,
    addFlag,
    updateFlag,
    deleteFlag,
    getFlagById,
    loading: appointmentsLoading,
    error: appointmentsError,
    refetch: refetchAppointments,
  };
};