# API Resilience - AtendeAí 2.0

## Estratégias de Resiliência

### 1. Tratamento de Erros
- Códigos HTTP apropriados
- Mensagens de erro claras
- Logs detalhados para debugging

### 2. Validação de Dados
- Validação de entrada em todos os endpoints
- Sanitização de dados
- Verificação de permissões

### 3. Performance
- Índices de banco otimizados
- Paginação em listagens
- Cache quando apropriado

### 4. Segurança
- Autenticação obrigatória
- Autorização baseada em clínica
- RLS (Row Level Security) no banco

## Endpoints Principais

### /api/appointments
- GET: Listar agendamentos com filtros
- POST: Criar novo agendamento
- PUT: Atualizar agendamento existente
- DELETE: Excluir agendamento

### /api/appointments/availability
- GET: Obter horários disponíveis para agendamento

## Remoções
- Todos os endpoints relacionados ao Google Calendar
- Endpoints de autenticação Google
- Sincronização externa
