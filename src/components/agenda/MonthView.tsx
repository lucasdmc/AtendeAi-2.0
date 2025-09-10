import React from 'react';
import { Badge } from '@/components/ui/badge';
import { format, isToday, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MonthViewProps {
  monthData: Array<{
    date: Date;
    isCurrentMonth: boolean;
    agendamentosCount: number;
  }>;
  currentDate: Date;
  onDayClick?: (date: Date) => void;
}

const MonthView: React.FC<MonthViewProps> = ({ monthData, currentDate, onDayClick }) => {
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header dos dias da semana */}
      <div className="grid grid-cols-7 bg-muted/50">
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium border-r border-border last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Grid do calendário */}
      <div className="grid grid-cols-7">
        {monthData.map((day, index) => (
          <div
            key={index}
            className={cn(
              "h-24 border-r border-b border-border last:border-r-0 p-2 cursor-pointer hover:bg-muted/30 transition-colors",
              !day.isCurrentMonth && "bg-muted/20 text-muted-foreground",
              isToday(day.date) && "bg-primary/10 border-primary"
            )}
            onClick={() => onDayClick?.(day.date)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={cn(
                "text-sm font-medium",
                isToday(day.date) && "text-primary font-bold"
              )}>
                {format(day.date, 'd')}
              </span>
              {day.agendamentosCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="text-xs h-5 w-5 rounded-full flex items-center justify-center p-0"
                >
                  {day.agendamentosCount}
                </Badge>
              )}
            </div>
            
            {day.agendamentosCount > 0 && (
              <div className="text-xs text-muted-foreground">
                {day.agendamentosCount} agendamento{day.agendamentosCount > 1 ? 's' : ''}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthView;