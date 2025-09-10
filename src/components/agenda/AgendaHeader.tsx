import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { AgendaView } from '@/types/agenda';
import { format, addDays, addMonths, addYears, subDays, subMonths, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AgendaHeaderProps {
  currentDate: Date;
  view: AgendaView;
  onDateChange: (date: Date) => void;
  onViewChange: (view: AgendaView) => void;
  onNewAgendamento: () => void;
}

const AgendaHeader: React.FC<AgendaHeaderProps> = ({
  currentDate,
  view,
  onDateChange,
  onViewChange,
  onNewAgendamento,
}) => {
  const handlePrevious = () => {
    switch (view) {
      case 'semana':
        onDateChange(subDays(currentDate, 7));
        break;
      case 'mes':
        onDateChange(subMonths(currentDate, 1));
        break;
      case 'ano':
        onDateChange(subYears(currentDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (view) {
      case 'semana':
        onDateChange(addDays(currentDate, 7));
        break;
      case 'mes':
        onDateChange(addMonths(currentDate, 1));
        break;
      case 'ano':
        onDateChange(addYears(currentDate, 1));
        break;
    }
  };

  const getDateLabel = () => {
    switch (view) {
      case 'semana':
        return format(currentDate, "'Semana de' dd 'de' MMMM, yyyy", { locale: ptBR });
      case 'mes':
        return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
      case 'ano':
        return format(currentDate, "yyyy", { locale: ptBR });
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Agenda</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium min-w-[200px] text-center">
            {getDateLabel()}
          </span>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <div className="flex border rounded-lg">
          <Button
            variant={view === 'semana' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('semana')}
            className="rounded-r-none"
          >
            Semana
          </Button>
          <Button
            variant={view === 'mes' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('mes')}
            className="rounded-none border-l border-r"
          >
            Mês
          </Button>
          <Button
            variant={view === 'ano' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('ano')}
            className="rounded-l-none"
          >
            Ano
          </Button>
        </div>

        <Button onClick={onNewAgendamento}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>
    </div>
  );
};

export default AgendaHeader;