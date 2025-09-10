import { useState, useMemo } from 'react';
import { Agendamento, AgendaFlag, AgendaView } from '@/types/agenda';
import { addDays, startOfWeek, format, isSameDay, isSameMonth, isSameYear, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mock data - em produção viria do backend
const mockFlags: AgendaFlag[] = [
  { id: '1', name: 'Consulta Regular', color: 'text-blue-700', backgroundColor: 'bg-blue-100' },
  { id: '2', name: 'Urgência', color: 'text-red-700', backgroundColor: 'bg-red-100' },
  { id: '3', name: 'Retorno', color: 'text-green-700', backgroundColor: 'bg-green-100' },
  { id: '4', name: 'Exame', color: 'text-purple-700', backgroundColor: 'bg-purple-100' },
];

const mockAgendamentos: Agendamento[] = [
  {
    id: '1',
    paciente_nome: 'João Silva',
    data_consulta: new Date(),
    horario_inicio: '09:00',
    horario_fim: '09:30',
    flag_id: '1',
    status: 'agendado',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '2',
    paciente_nome: 'Maria Santos',
    data_consulta: addDays(new Date(), 1),
    horario_inicio: '14:00',
    horario_fim: '14:30',
    flag_id: '2',
    status: 'confirmado',
    created_at: new Date(),
    updated_at: new Date(),
  },
];

export const useAgenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<AgendaView>('semana');
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(mockAgendamentos);
  const [flags, setFlags] = useState<AgendaFlag[]>(mockFlags);

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

  const addAgendamento = (agendamento: Omit<Agendamento, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
    const newAgendamento: Agendamento = {
      ...agendamento,
      id: Date.now().toString(),
      status: 'agendado',
      created_at: new Date(),
      updated_at: new Date(),
    };
    setAgendamentos(prev => [...prev, newAgendamento]);
  };

  const updateAgendamento = (id: string, updates: Partial<Agendamento>) => {
    setAgendamentos(prev => prev.map(agendamento => 
      agendamento.id === id 
        ? { ...agendamento, ...updates, updated_at: new Date() }
        : agendamento
    ));
  };

  const deleteAgendamento = (id: string) => {
    setAgendamentos(prev => prev.filter(agendamento => agendamento.id !== id));
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
  };
};