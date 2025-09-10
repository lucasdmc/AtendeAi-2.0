import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Agendamento, AgendaFlag } from '@/types/agenda';
import { cn } from '@/lib/utils';

interface WeekViewProps {
  weekData: Array<{
    date: Date;
    agendamentos: Agendamento[];
  }>;
  flags: AgendaFlag[];
  onAgendamentoClick?: (agendamento: Agendamento) => void;
}

const WeekView: React.FC<WeekViewProps> = ({ weekData, flags, onAgendamentoClick }) => {
  const getFlagById = (id: string) => flags.find(flag => flag.id === id);

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 7; // 7h às 18h
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  return (
    <div className="grid grid-cols-8 gap-1 h-[600px]">
      {/* Header com horas */}
      <div className="border-r border-border">
        <div className="h-16 border-b border-border flex items-center justify-center font-medium text-sm">
          Horário
        </div>
        {timeSlots.map(time => (
          <div key={time} className="h-12 border-b border-border flex items-center justify-center text-xs text-muted-foreground">
            {time}
          </div>
        ))}
      </div>

      {/* Dias da semana */}
      {weekData.map((day, dayIndex) => (
        <div key={dayIndex} className="border-r border-border last:border-r-0">
          {/* Header do dia */}
          <div className={cn(
            "h-16 border-b border-border flex flex-col items-center justify-center",
            isToday(day.date) && "bg-primary/10"
          )}>
            <div className={cn(
              "text-xs text-muted-foreground",
              isToday(day.date) && "text-primary font-medium"
            )}>
              {format(day.date, 'EEE', { locale: ptBR })}
            </div>
            <div className={cn(
              "text-lg font-semibold",
              isToday(day.date) && "text-primary"
            )}>
              {format(day.date, 'd')}
            </div>
          </div>

          {/* Grid de horas do dia */}
          <div className="relative">
            {timeSlots.map((time, timeIndex) => (
              <div key={time} className="h-12 border-b border-border" />
            ))}
            
            {/* Agendamentos posicionados absolutamente */}
            {day.agendamentos.map((agendamento, agendamentoIndex) => {
              const flag = getFlagById(agendamento.flag_id);
              const [startHour, startMinute] = agendamento.horario_inicio.split(':').map(Number);
              const [endHour, endMinute] = agendamento.horario_fim.split(':').map(Number);
              
              const startPosition = ((startHour - 7) + startMinute / 60) * 48; // 48px por hora
              const duration = ((endHour - startHour) + (endMinute - startMinute) / 60) * 48;
              
              return (
                <Card
                  key={agendamento.id}
                  className={cn(
                    "absolute left-1 right-1 cursor-pointer hover:shadow-md transition-shadow",
                    flag?.backgroundColor || 'bg-gray-100'
                  )}
                  style={{
                    top: `${startPosition}px`,
                    height: `${Math.max(duration, 24)}px`,
                    zIndex: 10 + agendamentoIndex
                  }}
                  onClick={() => onAgendamentoClick?.(agendamento)}
                >
                  <CardContent className="p-2 h-full flex flex-col justify-center">
                    <div className={cn("text-xs font-medium truncate", flag?.color || 'text-gray-700')}>
                      {agendamento.paciente_nome}
                    </div>
                    <div className={cn("text-xs truncate", flag?.color || 'text-gray-600')}>
                      {agendamento.horario_inicio}
                    </div>
                    {flag && (
                      <Badge variant="secondary" className="text-xs mt-1 self-start">
                        {flag.name}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WeekView;