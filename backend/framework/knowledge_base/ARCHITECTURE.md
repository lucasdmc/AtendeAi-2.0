# 🏗️ ARQUITETURA COMPLETA - ATENDEAI 2.0

---

## 🎯 **VISÃO GERAL DA ARQUITETURA**

### **Nome do Projeto**
**AtendeAI 2.0** - Sistema de Inteligência Artificial para WhatsApp

### **Arquitetura**
**Microserviços** com **API Gateway**, **Load Balancer** e **Monitoramento Completo**

---

## 🏗️ **COMPONENTES DA INFRAESTRUTURA**

### **1. Containerização e Orquestração**
- **Docker**: Containerização de todos os serviços
- **Docker Compose**: Orquestração local e desenvolvimento
- **Networks**: Rede isolada `atendeai-network` (172.20.0.0/16)

### **2. Banco de Dados**
- **PostgreSQL 15**: Banco principal com particionamento
- **Extensões**: UUID, PGCrypto para segurança
- **Schema**: `atendeai` com isolamento por clínica
- **Porta**: 5432
- **Volume**: `postgres_data` persistente

### **3. Cache e Sessões**
- **Redis 7**: Cache distribuído e sessões
- **Configuração**: AOF habilitado para persistência
- **Autenticação**: Senha `redis123`
- **Porta**: 6379
- **Volume**: `redis_data` persistente

### **4. API Gateway**
- **Kong 3.4**: Gateway principal com configuração declarativa
- **Portas**:
  - 8000: Proxy principal
  - 8001: Admin API
  - 8002: Admin GUI
  - 8443: SSL Proxy (desabilitado em dev)
- **Configuração**: Arquivo `kong-config.yml`

### **5. Load Balancer**
- **HAProxy 2.8**: Balanceamento de carga
- **Portas**: 80 (HTTP), 443 (HTTPS)
- **Configuração**: Arquivo `haproxy.cfg`
- **Dependências**: Kong + todos os serviços

---

## 🔧 **SERVIÇOS IMPLEMENTADOS**

### **1. Auth Service (Porta 3001)**
- **Framework**: Node.js + Express
- **Funcionalidades**: JWT, refresh tokens, bcrypt
- **Dependências**: PostgreSQL, Redis
- **Endpoints**: `/api/v1/auth/*`, `/health`
- **Segurança**: Helmet, CORS, Rate Limiting

### **2. User Service (Porta 3002)**
- **Framework**: Node.js + Express
- **Funcionalidades**: Gestão de usuários, RBAC
- **Dependências**: PostgreSQL, Redis
- **Endpoints**: `/api/v1/users/*`, `/health`

### **3. Clinic Service (Porta 3003)**
- **Framework**: Node.js + Express
- **Funcionalidades**: Multi-tenancy, contextualização
- **Dependências**: PostgreSQL, Redis
- **Endpoints**: `/api/v1/clinics/*`, `/health`

### **4. Health Service (Porta 3004)**
- **Framework**: Node.js + Express
- **Funcionalidades**: Health checks agregados
- **Dependências**: PostgreSQL, Redis
- **Endpoints**: `/health`

### **5. Conversation Service (Porta 3005)**
- **Framework**: Node.js + Express
- **Funcionalidades**: IA, processamento de mensagens
- **Dependências**: PostgreSQL, Redis
- **Endpoints**: `/api/v1/conversations/*`, `/health`

### **6. Appointment Service (Porta 3006)**
- **Framework**: Node.js + Express
- **Funcionalidades**: Máquina de estados, agendamentos
- **Dependências**: PostgreSQL, Redis
- **Endpoints**: `/api/v1/appointments/*`, `/health`

### **7. WhatsApp Service (Porta 3007)**
- **Framework**: Node.js + Express
- **Funcionalidades**: Integração WhatsApp Business API
- **Dependências**: PostgreSQL, Redis
- **Endpoints**: `/webhook/whatsapp`, `/api/v1/whatsapp/*`

### **8. Google Calendar Service (Porta 3008)**
- **Framework**: Node.js + Express
- **Funcionalidades**: Sincronização Google Calendar
- **Dependências**: PostgreSQL, Redis
- **Endpoints**: `/api/v1/calendar/*`

---

## 📊 **SISTEMA DE MONITORAMENTO**

### **1. Prometheus**
- **Porta**: 9090
- **Configuração**: `monitoring/prometheus.yml`
- **Targets**: Todos os serviços + infraestrutura
- **Retenção**: 200 horas
- **Volume**: `prometheus_data` persistente

### **2. Grafana**
- **Porta**: 3000
- **Credenciais**: admin/admin123
- **Dashboards**: Provisionamento automático
- **Datasources**: Prometheus configurado
- **Volume**: `grafana_data` persistente

### **3. Métricas Coletadas**
- **Serviços**: HTTP requests, response time, error rate
- **Infraestrutura**: CPU, memória, disco
- **Banco**: Conexões, queries, performance
- **Cache**: Hit ratio, memória, operações

---

## 🔒 **SEGURANÇA E AUTENTICAÇÃO**

### **1. JWT Tokens**
- **Access Token**: 15 minutos
- **Refresh Token**: 7 dias
- **Algoritmo**: HS256
- **Secret**: Configurável por ambiente

### **2. Rate Limiting**
- **Auth Endpoints**: 5/min, 100/hora
- **API Endpoints**: 100/min, 1000/hora
- **Policy**: Local (Redis-based)

### **3. CORS**
- **Origins**: Configuráveis por ambiente
- **Credentials**: Habilitado
- **Methods**: GET, POST, PUT, DELETE, OPTIONS

### **4. Headers de Segurança**
- **Helmet**: CSP, HSTS, XSS Protection
- **Custom**: X-Service, X-Version, X-Clinic-ID

---

## 🌐 **REDE E COMUNICAÇÃO**

### **1. Rede Interna**
- **Subnet**: 172.20.0.0/16
- **Driver**: Bridge
- **Isolamento**: Serviços isolados por rede

### **2. Portas Expostas**
- **80**: HAProxy (HTTP)
- **443**: HAProxy (HTTPS)
- **3000**: Grafana
- **3001-3008**: Serviços individuais
- **5432**: PostgreSQL
- **6379**: Redis
- **8000**: Kong Proxy
- **8001**: Kong Admin
- **8002**: Kong GUI
- **9090**: Prometheus

### **3. Health Checks**
- **Intervalo**: 30s
- **Timeout**: 10s
- **Retries**: 3
- **Start Period**: 40s

---

## 📁 **ESTRUTURA DE ARQUIVOS**

```
AtendeAí 2.0/
├── docker-compose.yml              # Orquestração principal
├── scripts/
│   ├── start-infrastructure.sh     # Inicialização
│   └── test-connectivity.sh        # Testes
├── services/                       # Todos os microserviços
├── framework/
│   └── deliverables/
│       └── 01-foundation/         # Configurações base
├── monitoring/                     # Prometheus + Grafana
├── haproxy/                        # Configuração HAProxy
└── .env                           # Variáveis de ambiente
```

---

## 🚀 **COMANDOS DE OPERAÇÃO**

### **Inicialização**
```bash
# Iniciar toda a infraestrutura
./scripts/start-infrastructure.sh

# Ou manualmente
docker-compose up -d
```

### **Testes**
```bash
# Testar conectividade
./scripts/test-connectivity.sh

# Ver logs
docker-compose logs [service-name]
```

### **Manutenção**
```bash
# Reiniciar serviço
docker-compose restart [service-name]

# Parar tudo
docker-compose down

# Limpar volumes
docker-compose down -v
```

---

## 📊 **MÉTRICAS DE PERFORMANCE**

### **Objetivos**
- **Response Time**: < 200ms (95%)
- **Uptime**: > 99.9%
- **Throughput**: 1000+ req/s
- **Recovery**: < 2 minutos

### **Monitoramento**
- **Tempo Real**: Prometheus + Grafana
- **Alertas**: Configuráveis por métrica
- **Histórico**: 200 horas de dados
- **Exportação**: Múltiplos formatos

---

## 🔄 **FLUXO DE REQUISIÇÕES**

```
Cliente → HAProxy → Kong → Serviço → PostgreSQL/Redis
                ↓
            Prometheus ← Métricas ← Serviços
                ↓
            Grafana (Dashboards)
```

---

## ⚠️ **CONSIDERAÇÕES DE PRODUÇÃO**

### **1. Segurança**
- **Secrets**: Usar Docker Secrets ou Vault
- **SSL**: Habilitar HTTPS em Kong
- **Firewall**: Restringir portas expostas
- **Backup**: Estratégia de backup dos volumes

### **2. Escalabilidade**
- **Horizontal**: Adicionar réplicas dos serviços
- **Vertical**: Ajustar recursos dos containers
- **Load Balancing**: HAProxy com múltiplas instâncias
- **Database**: Read replicas, connection pooling

### **3. Monitoramento**
- **Alertas**: Configurar notificações críticas
- **Logs**: Centralizar logs (ELK Stack)
- **Tracing**: Implementar OpenTelemetry
- **SLA**: Definir métricas de negócio

---

**Documento criado em:** 2024-01-15  
**Versão:** 1.0.0  
**Status:** IMPLEMENTADO  
**Próxima revisão:** Após testes de produção
