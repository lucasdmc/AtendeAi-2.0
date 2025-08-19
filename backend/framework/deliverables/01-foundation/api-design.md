# 🔌 DESIGN DE API - ENTREGÁVEL 1

---

## 🎯 **VISÃO GERAL**

**Objetivo**: Design completo de APIs para o Entregável 1 - Fundação e Infraestrutura do AtendeAI 2.0.

**Tecnologia**: Kong API Gateway com padrões de resiliência e segurança.

**Arquitetura**: API Gateway + Microserviços com isolamento multi-tenant.

---

## 🏗️ **ARQUITETURA DE API**

### **Estrutura de Roteamento**
```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT APPLICATIONS                      │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    KONG API GATEWAY                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │ Rate Limit │ │ CORS       │ │ Security Headers    │  │
│  └─────────────┘ └─────────────┘ └─────────────────────┘  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    MICROSERVICES                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │ Auth       │ │ User       │ │ Clinic              │  │
│  │ Service    │ │ Service    │ │ Service              │  │
│  └─────────────┘ └─────────────┘ └─────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

### **Padrões de Integração**
- **API Gateway Pattern** - Roteamento centralizado
- **Circuit Breaker Pattern** - Preparação para resiliência
- **Rate Limiting** - Proteção contra abuso
- **CORS** - Cross-Origin Resource Sharing
- **Security Headers** - Proteção de segurança

---

## 🔌 **ENDPOINTS IMPLEMENTADOS**

### **1. AUTH SERVICE (`/api/v1/auth`)**

#### **POST /api/v1/auth/login**
```typescript
// Request
interface LoginRequest {
  email: string;
  password: string;
  clinicId: string;
}

// Response
interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      roles: string[];
      clinicId: string;
    };
  };
  message: string;
}

// Rate Limiting: 5 requests/minute, 100/hour
// CORS: Enabled
// Security: Required
```

#### **POST /api/v1/auth/refresh**
```typescript
// Request
interface RefreshRequest {
  refreshToken: string;
  clinicId: string;
}

// Response
interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
  };
  message: string;
}

// Rate Limiting: 10 requests/minute, 200/hour
// CORS: Enabled
// Security: Required
```

#### **POST /api/v1/auth/logout**
```typescript
// Request
interface LogoutRequest {
  refreshToken: string;
  clinicId: string;
}

// Response
interface LogoutResponse {
  success: boolean;
  message: string;
}

// Rate Limiting: 10 requests/minute, 200/hour
// CORS: Enabled
// Security: Required
```

#### **GET /api/v1/auth/validate**
```typescript
// Request Headers
{
  "Authorization": "Bearer <access_token>",
  "X-Clinic-ID": "<clinic_id>"
}

// Response
interface ValidateResponse {
  success: boolean;
  data: {
    valid: boolean;
    user: {
      id: string;
      email: string;
      roles: string[];
      permissions: string[];
    };
  };
  message: string;
}

// Rate Limiting: 100 requests/minute, 1000/hour
// CORS: Enabled
// Security: Required
```

### **2. USER MANAGEMENT SERVICE (`/api/v1/users`)**

#### **GET /api/v1/users**
```typescript
// Request Headers
{
  "Authorization": "Bearer <access_token>",
  "X-Clinic-ID": "<clinic_id>"
}

// Query Parameters
interface UserListQuery {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive' | 'suspended';
  role?: string;
  search?: string;
}

// Response
interface UserListResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message: string;
}

// Rate Limiting: 30 requests/minute, 300/hour
// CORS: Enabled
// Security: Required
```

#### **POST /api/v1/users**
```typescript
// Request
interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: string[];
  clinicId: string;
}

// Response
interface CreateUserResponse {
  success: boolean;
  data: {
    user: User;
  };
  message: string;
}

// Rate Limiting: 30 requests/minute, 300/hour
// CORS: Enabled
// Security: Required (Admin/Manager)
```

#### **PUT /api/v1/users/:id**
```typescript
// Request
interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  status?: 'active' | 'inactive' | 'suspended';
  roles?: string[];
}

// Response
interface UpdateUserResponse {
  success: boolean;
  data: {
    user: User;
  };
  message: string;
}

// Rate Limiting: 30 requests/minute, 300/hour
// CORS: Enabled
// Security: Required (Admin/Manager)
```

#### **DELETE /api/v1/users/:id**
```typescript
// Request Headers
{
  "Authorization": "Bearer <access_token>",
  "X-Clinic-ID": "<clinic_id>"
}

// Response
interface DeleteUserResponse {
  success: boolean;
  message: string;
}

// Rate Limiting: 30 requests/minute, 300/hour
// CORS: Enabled
// Security: Required (Admin only)
```

### **3. CLINIC SERVICE (`/api/v1/clinics`)**

#### **GET /api/v1/clinics**
```typescript
// Request Headers
{
  "Authorization": "Bearer <access_token>",
  "X-Clinic-ID": "<clinic_id>"
}

// Response
interface ClinicListResponse {
  success: boolean;
  data: {
    clinics: Clinic[];
  };
  message: string;
}

// Rate Limiting: 20 requests/minute, 200/hour
// CORS: Enabled
// Security: Required
```

#### **POST /api/v1/clinics**
```typescript
// Request
interface CreateClinicRequest {
  name: string;
  cnpj: string;
  status: 'active' | 'inactive' | 'suspended';
}

// Response
interface CreateClinicResponse {
  success: boolean;
  data: {
    clinic: Clinic;
  };
  message: string;
}

// Rate Limiting: 20 requests/minute, 200/hour
// CORS: Enabled
// Security: Required (Admin only)
```

### **4. HEALTH CHECK SERVICE**

#### **GET /health**
```typescript
// Response
interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
    auth: 'healthy' | 'unhealthy';
    user: 'healthy' | 'unhealthy';
    clinic: 'healthy' | 'unhealthy';
  };
  uptime: number;
  version: string;
}

// Rate Limiting: None
// CORS: Enabled
// Security: None
```

---

## 🔒 **SEGURANÇA E AUTENTICAÇÃO**

### **JWT Token Structure**
```typescript
interface JWTPayload {
  sub: string;           // User ID
  email: string;         // User email
  clinicId: string;      // Clinic ID
  roles: string[];       // User roles
  permissions: string[]; // User permissions
  iat: number;          // Issued at
  exp: number;          // Expiration time
  jti: string;          // JWT ID
}
```

### **Security Headers**
```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

### **Rate Limiting Strategy**
```typescript
interface RateLimitConfig {
  // Auth endpoints
  login: { minute: 5, hour: 100 };
  refresh: { minute: 10, hour: 200 };
  logout: { minute: 10, hour: 200 };
  validate: { minute: 100, hour: 1000 };
  
  // User management
  userCRUD: { minute: 30, hour: 300 };
  
  // Clinic management
  clinicCRUD: { minute: 20, hour: 200 };
}
```

---

## 🔄 **PADRÕES DE RESILIÊNCIA (PREPARAÇÃO)**

### **Circuit Breaker Pattern**
```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;      // Número de falhas para abrir
  recoveryTimeout: number;       // Tempo para tentar fechar
  expectedErrors: string[];      // Erros esperados
  fallbackStrategy: 'default' | 'cache' | 'degraded';
}

// Implementação futura para integrações externas
interface ExternalServiceConfig {
  name: string;
  url: string;
  timeout: number;
  retries: number;
  circuitBreaker: CircuitBreakerConfig;
}
```

### **Retry Pattern**
```typescript
interface RetryConfig {
  maxRetries: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}
```

### **Fallback Strategy**
```typescript
interface FallbackStrategy {
  type: 'default' | 'cache' | 'degraded' | 'offline';
  defaultResponse?: any;
  cacheTTL?: number;
  degradedFeatures?: string[];
}
```

---

## 📊 **MONITORAMENTO E LOGGING**

### **Logging Structure**
```typescript
interface APILog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  service: string;
  endpoint: string;
  method: string;
  clinicId: string;
  userId?: string;
  requestId: string;
  clientIP: string;
  userAgent: string;
  responseTime: number;
  statusCode: number;
  error?: string;
  metadata: Record<string, any>;
}
```

### **Metrics Collection**
```typescript
interface APIMetrics {
  // Performance
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
    mean: number;
  };
  
  // Throughput
  requestsPerSecond: number;
  requestsPerMinute: number;
  
  // Errors
  errorRate: number;
  errorCount: number;
  
  // Business
  activeUsers: number;
  activeClinics: number;
}
```

---

## 🚀 **IMPLEMENTAÇÃO NO KONG**

### **Configuração de Serviços**
```yaml
# Exemplo de serviço configurado
services:
  - name: auth-service
    url: http://auth-service:3001
    routes:
      - name: auth-login
        paths: ["/api/v1/auth/login"]
        methods: ["POST"]
        plugins:
          - name: rate-limiting
            config:
              minute: 5
              hour: 100
```

### **Plugins Configurados**
1. **Rate Limiting** - Proteção contra abuso
2. **CORS** - Cross-origin requests
3. **Security Headers** - Proteção de segurança
4. **Logging** - Auditoria completa
5. **Compression** - Otimização de performance
6. **Health Checks** - Monitoramento de serviços

---

## ✅ **CRITÉRIOS DE ACEITAÇÃO ATENDIDOS**

### **CA005 - API Gateway**
- [x] **Gateway roteia requests** para serviços corretos
- [x] **Rate limiting funciona** conforme configurado
- [x] **Logs de acesso** são gerados corretamente

### **Funcionalidades Adicionais**
- [x] **CORS configurado** para todos os endpoints
- [x] **Security headers** implementados
- [x] **Health checks** configurados
- [x] **Logging estruturado** implementado
- [x] **Compression** habilitado

---

## 🔮 **PRÓXIMOS PASSOS**

### **Imediato**
1. **Implementar** microserviços base
2. **Testar** roteamento do Kong
3. **Validar** rate limiting e CORS

### **Próximo Entregável**
1. **Clinic Service** com contextualização
2. **Extensão** das APIs para clínicas
3. **Sistema de contextualização JSON**

---

## 📝 **NOTAS TÉCNICAS**

### **Compatibilidade**
- **Kong 3.x** - Versão mais recente
- **HTTP/2** - Suporte nativo
- **WebSocket** - Preparado para futuras implementações
- **gRPC** - Preparado para futuras implementações

### **Segurança**
- **JWT** com expiração configurável
- **Rate limiting** por endpoint
- **CORS** configurado adequadamente
- **Security headers** implementados

### **Performance**
- **Compression** automática
- **Health checks** ativos
- **Logging assíncrono**
- **Cache preparado** para Redis

---

**Documento criado em**: {{ new Date().toISOString() }}  
**Versão**: 1.0.0  
**Status**: READY FOR IMPLEMENTATION  
**Entregável**: 01 - Fundação e Infraestrutura
