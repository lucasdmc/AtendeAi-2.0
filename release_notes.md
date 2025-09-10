# Release Notes - AtendeAí 2.0

## Versão 2.0.0 - 2025-01-09

### 🎉 Principais Mudanças

#### ✨ Novas Funcionalidades
- **Agenda Própria**: Nova tela de agenda independente de serviços externos
- **Gestão de Agendamentos**: CRUD completo de agendamentos locais
- **Interface Melhorada**: Design moderno e responsivo para gestão de agendamentos

#### 🔧 Melhorias Técnicas
- **Build Otimizado**: Correção de erros de runtime (ReferenceError process, SyntaxError lexical variable)
- **Configuração Vite**: Ajustes para funcionamento correto do frontend
- **Código Limpo**: Remoção de dependências desnecessárias

#### 🗑️ Remoções
- **Google Auth**: Removida integração com Google Authentication
- **Google Calendar**: Removida integração com Google Calendar
- **Serviços Externos**: Sistema agora funciona independentemente

### 📋 Detalhes Técnicos

#### Arquivos Modificados
- `src/components/Layout.tsx` - Corrigida variável isLoading duplicada
- `vite.config.ts` - Configuração do process para resolver erros de build
- `src/App.tsx` - Adicionada rota da nova Agenda
- `src/components/AppSidebar.tsx` - Adicionado link para Agenda

#### Arquivos Criados
- `src/pages/Agenda.tsx` - Nova tela de agenda
- `src/services/appointmentService.ts` - Serviço de agendamentos
- `framework/db/migrations/004_remove_google_add_agenda.sql` - Migration do banco

#### Arquivos Removidos
- `src/services/googleCalendarService.ts` - Serviço Google removido

### 🎯 Funcionalidades da Nova Agenda

#### Visualização
- Calendário com agendamentos do dia
- Lista detalhada de agendamentos
- Status visual dos agendamentos (Agendado, Confirmado, Cancelado, Concluído)

#### Gestão
- Criar novos agendamentos
- Editar agendamentos existentes
- Excluir agendamentos
- Gerenciar horários disponíveis

#### Informações do Paciente
- Nome, telefone e email
- Observações e notas
- Duração personalizável do agendamento

### 🔄 Migração Necessária

Execute a migration do banco de dados:
```sql
-- Executar framework/db/migrations/004_remove_google_add_agenda.sql
```

### 🚀 Deploy

Para fazer deploy:
```bash
npm run build
# Deploy dos arquivos da pasta dist/
```

### 📞 Suporte

Para dúvidas ou problemas, consulte:
- `docs/system_spec.md` - Especificação do sistema
- `docs/acceptance_report.md` - Relatório de aceitação
- `docs/traceability.csv` - Rastreabilidade de requisitos

---

**Desenvolvido com ❤️ para o AtendeAí 2.0**
