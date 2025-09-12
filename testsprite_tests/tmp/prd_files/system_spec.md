# Especificação do Sistema - AtendeAí 2.0

## Estado Atual
- ✅ Dados mock removidos completamente
- ✅ Interfaces prontas para integração
- ⚠️ APIs backend necessárias para funcionalidades pendentes

## Funcionalidades Pendentes

### 1. Envio de Mensagens (Conversations)
- **Localização**: src/pages/Conversations.tsx
- **Status**: Interface pronta, API pendente
- **Endpoint**: POST /api/conversations/:id/messages
- **Payload**: { message: string, sender: string }

### 2. Atribuição Manual (Conversations)  
- **Localização**: src/pages/Conversations.tsx
- **Status**: Interface pronta, API pendente
- **Endpoint**: PUT /api/conversations/:id/assign
- **Payload**: { assigned_user_id: string, mode: 'manual'|'auto' }

### 3. Criação/Edição de Clínicas
- **Localização**: src/pages/Clinics.tsx
- **Status**: Formulários prontos, API pendente
- **Endpoints**: 
  - POST /api/clinics (criar)
  - PUT /api/clinics/:id (editar)
- **Payload**: { name, whatsapp_number, context_json, etc. }

### 4. Autenticação
- **Localização**: src/hooks/useAuth.tsx
- **Status**: Estrutura pronta, integração pendente
- **Endpoint**: POST /api/auth/login
- **Payload**: { login, password }

## Backend Services Necessários
- whatsapp-service (porta 3001)
- conversation-service (porta 3002)
- clinic-service (porta 3003)
- appointment-service (porta 3004)
- auth-service (porta 3005)

## Próximos Passos
1. Implementar chamadas reais para APIs
2. Testar integração com backend
3. Validar funcionalidades end-to-end
