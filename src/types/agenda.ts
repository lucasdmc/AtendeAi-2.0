export interface AgendaFlag {
  id: string;
  name: string;
  color: string;
  backgroundColor: string;
  description?: string;
}

export interface Agendamento {
  id: string;
  paciente_nome: string;
  data_consulta: Date;
  horario_inicio: string;
  horario_fim: string;
  flag_id: string;
  observacoes?: string;
  status: 'agendado' | 'confirmado' | 'cancelado' | 'realizado';
  created_at: Date;
  updated_at: Date;
}

export type AgendaView = 'semana' | 'mes' | 'ano';

export interface AgendamentoForm {
  paciente_nome: string;
  data_consulta: Date;
  horario_inicio: string;
  horario_fim: string;
  flag_id: string;
  observacoes?: string;
}