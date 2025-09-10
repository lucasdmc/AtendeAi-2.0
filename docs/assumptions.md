# Assumptions - AtendeAí 2.0

## Assumptions Técnicas
- Backend services estarão disponíveis nas portas especificadas
- APIs seguirão padrão REST com JSON
- Autenticação será via JWT token
- Banco de dados estará populado com dados reais

## Assumptions de Negócio
- Usuários terão acesso às clínicas baseado em roles
- Conversas serão atribuídas automaticamente ou manualmente
- Agendamentos serão sincronizados com Google Calendar
- WhatsApp será o canal principal de comunicação

## Dependências Externas
- Meta WhatsApp Business API
- Google Calendar API
- Supabase (banco de dados)
- Railway (deploy)
