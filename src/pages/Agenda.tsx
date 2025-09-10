import React, { useState } from 'react';
import { useAgenda } from '@/hooks/useAgenda';
import AgendaHeader from '@/components/agenda/AgendaHeader';
import WeekView from '@/components/agenda/WeekView';
import MonthView from '@/components/agenda/MonthView';
import YearView from '@/components/agenda/YearView';
import AgendamentoModal from '@/components/agenda/AgendamentoModal';
import { toast } from 'sonner';

const Agenda: React.FC = () => {
  const {
    currentDate,
    setCurrentDate,
    view,
    setView,
    weekData,
    monthData,
    yearData,
    flags,
    addAgendamento,
    getFlagById,
  } = useAgenda();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const handleNewAgendamento = () => {
    setSelectedDate(currentDate);
    setIsModalOpen(true);
  };

  const handleAgendamentoSubmit = (agendamentoData: any) => {
    addAgendamento(agendamentoData);
    toast.success('Agendamento criado com sucesso!');
  };

  const handleDayClick = (date: Date) => {
    if (view === 'mes') {
      setCurrentDate(date);
      setView('semana');
    }
  };

  const handleMonthClick = (date: Date) => {
    if (view === 'ano') {
      setCurrentDate(date);
      setView('mes');
    }
  };

  const renderView = () => {
    switch (view) {
      case 'semana':
        return (
          <WeekView
            weekData={weekData}
            flags={flags}
            onAgendamentoClick={(agendamento) => {
              const flag = getFlagById(agendamento.flag_id);
              toast.info(`${agendamento.paciente_nome} - ${agendamento.horario_inicio} (${flag?.name})`);
            }}
          />
        );
      case 'mes':
        return (
          <MonthView
            monthData={monthData}
            currentDate={currentDate}
            onDayClick={handleDayClick}
          />
        );
      case 'ano':
        return (
          <YearView
            yearData={yearData}
            onMonthClick={handleMonthClick}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <AgendaHeader
        currentDate={currentDate}
        view={view}
        onDateChange={setCurrentDate}
        onViewChange={setView}
        onNewAgendamento={handleNewAgendamento}
      />

      <div className="mb-6">
        {renderView()}
      </div>

      <AgendamentoModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleAgendamentoSubmit}
        flags={flags}
        initialDate={selectedDate}
      />
    </div>
  );
};

export default Agenda;