import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgendaFlag, AgendamentoForm } from '@/types/agenda';

const formSchema = z.object({
  paciente_nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  data_consulta: z.date({
    required_error: 'Data da consulta é obrigatória',
  }),
  horario_inicio: z.string().min(1, 'Horário de início é obrigatório'),
  horario_fim: z.string().min(1, 'Horário de fim é obrigatório'),
  flag_id: z.string().min(1, 'Tipo de consulta é obrigatório'),
  observacoes: z.string().optional(),
});

interface AgendamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AgendamentoForm) => void;
  flags: AgendaFlag[];
  initialDate?: Date;
}

const AgendamentoModal: React.FC<AgendamentoModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  flags,
  initialDate
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paciente_nome: '',
      data_consulta: initialDate || new Date(),
      horario_inicio: '',
      horario_fim: '',
      flag_id: '',
      observacoes: '',
    },
  });
  
  React.useEffect(() => {
    if (initialDate) {
      form.setValue('data_consulta', initialDate);
    }
  }, [initialDate, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values as AgendamentoForm);
    form.reset();
    onOpenChange(false);
  };

  // Gerar opções de horário de 30 em 30 minutos
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = Math.floor(i / 2) + 7; // Começar às 7h
    const minute = i % 2 === 0 ? '00' : '30';
    const timeString = `${hour.toString().padStart(2, '0')}:${minute}`;
    
    if (hour >= 19) return null; // Parar às 18:30
    
    return {
      value: timeString,
      label: timeString
    };
  }).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="paciente_nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Paciente</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome do paciente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data_consulta"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Consulta</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd 'de' MMMM, yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="horario_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário Início</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Início" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((option) => (
                          <SelectItem key={option!.value} value={option!.value}>
                            {option!.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="horario_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário Fim</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Fim" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((option) => (
                          <SelectItem key={option!.value} value={option!.value}>
                            {option!.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="flag_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Consulta</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {flags.map((flag) => (
                        <SelectItem key={flag.id} value={flag.id}>
                          <div className="flex items-center space-x-2">
                            <div className={cn("w-3 h-3 rounded", flag.backgroundColor)} />
                            <span>{flag.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Agendar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AgendamentoModal;