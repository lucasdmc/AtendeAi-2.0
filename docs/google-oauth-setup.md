# Configuração do Google OAuth - AtendeAí 2.0

## Problema Identificado
O erro `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}` indica que o Google OAuth não está habilitado no Supabase.

## Soluções Implementadas

### 1. Métodos OAuth Diretos no Backend
Adicionamos métodos diretos de OAuth no serviço do Google Calendar:
- `getAuthorizationUrl()` - Gera URL de autorização
- `handleOAuthCallback()` - Processa callback OAuth
- `saveTokensToClinic()` - Salva tokens na clínica

### 2. Configuração Necessária no Supabase

#### Passo 1: Habilitar Google OAuth no Supabase
1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para Authentication > Providers
4. Habilite o Google provider
5. Configure:
   - Client ID: `367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com`
   - Client Secret: (obtenha do Google Console)
   - Redirect URL: `http://localhost:3008/auth/google/callback`

#### Passo 2: Configurar Google Console
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto ou selecione existente
3. Habilite Google Calendar API
4. Configure OAuth 2.0:
   - Authorized redirect URIs:
     - `http://localhost:3008/auth/google/callback`
     - `https://yourdomain.com/auth/google/callback`

### 3. Variáveis de Ambiente
Certifique-se de que as seguintes variáveis estão configuradas:

```env
# Google OAuth
GOOGLE_CLIENT_ID=367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3008/auth/google/callback
GOOGLE_API_KEY=your_google_api_key

# Supabase
SUPABASE_URL=https://kytphnasmdvebmdvvwtx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Teste da Integração
1. Inicie o servidor: `npm run dev -- --port 8080`
2. Acesse `/calendar` (agora `/agenda`)
3. Clique em "Conectar Google Calendar"
4. Complete o fluxo OAuth
5. Verifique se o calendário é exibido como iframe

## Status da Implementação
- ✅ Renomeação Calendário → Agenda
- ✅ Métodos OAuth no backend
- ✅ Componente GoogleCalendarEmbed
- ⏳ Configuração Supabase (requer ação manual)
- ⏳ Teste completo da integração

## Próximos Passos
1. Configurar Google OAuth no Supabase
2. Testar fluxo completo
3. Validar embed do calendário
4. Documentar processo de configuração
