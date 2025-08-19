# 📊 SISTEMA DE MONITORAMENTO - ATENDEAI 2.0

---

## 🎯 **VISÃO GERAL DO MONITORAMENTO**

### **Objetivo**
Sistema completo de observabilidade para monitorar a saúde, performance e disponibilidade de todos os serviços da infraestrutura AtendeAI 2.0.

### **Componentes**
- **Prometheus**: Coleta e armazenamento de métricas
- **Grafana**: Visualização e dashboards
- **Kong**: API Gateway com métricas integradas
- **HAProxy**: Load balancer com estatísticas
- **Serviços**: Métricas nativas de cada microserviço

---

## 🔍 **PROMETHEUS - COLETOR DE MÉTRICAS**

### **Configuração**
- **Porta**: 9090
- **Configuração**: `monitoring/prometheus.yml`
- **Retenção**: 200 horas
- **Volume**: `prometheus_data` persistente

### **Targets Configurados**

#### **Microserviços**
- **Auth Service** (3001): `/metrics`
- **User Service** (3002): `/metrics`
- **Clinic Service** (3003): `/metrics`
- **Health Service** (3004): `/metrics`
- **Conversation Service** (3005): `/metrics`
- **Appointment Service** (3006): `/metrics`
- **WhatsApp Service** (3007): `/metrics`
- **Google Calendar Service** (3008): `/metrics`

#### **Infraestrutura**
- **PostgreSQL** (5432): Métricas do banco
- **Redis** (6379): Métricas de cache
- **Kong** (8001): Métricas do API Gateway
- **HAProxy** (80): Métricas do load balancer

### **Métricas Coletadas**

#### **HTTP Metrics**
```
http_requests_total{method="POST",status="200",service="auth-service"}
http_request_duration_seconds{service="clinic-service",quantile="0.95"}
http_requests_in_flight{service="user-service"}
```

#### **System Metrics**
```
process_cpu_seconds_total{service="auth-service"}
process_resident_memory_bytes{service="clinic-service"}
go_goroutines{service="conversation-service"}
```

#### **Business Metrics**
```
appointments_total{clinic_id="123",status="confirmed"}
conversations_active{clinic_id="123"}
whatsapp_messages_sent_total{clinic_id="123"}
```

---

## 📊 **GRAFANA - VISUALIZAÇÃO E DASHBOARDS**

### **Configuração**
- **Porta**: 3000
- **Credenciais**: admin/admin123
- **Provisionamento**: Automático
- **Volume**: `grafana_data` persistente

### **Dashboards Disponíveis**

#### **1. AtendeAI Overview**
- **Status dos Serviços**: Verde/vermelho para cada serviço
- **HTTP Request Rate**: Requisições por segundo
- **Response Time**: Tempo de resposta 95th percentile
- **Error Rate**: Taxa de erros 5xx

#### **2. Service Health**
- **Health Checks**: Status individual de cada serviço
- **Uptime**: Tempo de funcionamento
- **Restarts**: Contagem de reinicializações
- **Dependencies**: Status das dependências

#### **3. Performance Metrics**
- **Throughput**: Requisições por segundo
- **Latency**: Distribuição de latência
- **Queue Depth**: Profundidade das filas
- **Resource Usage**: CPU, memória, disco

#### **4. Business Metrics**
- **Appointments**: Agendamentos por clínica
- **Conversations**: Conversas ativas
- **WhatsApp Messages**: Mensagens enviadas/recebidas
- **User Activity**: Atividade dos usuários

### **Alertas Configurados**

#### **Critical Alerts**
- **Service Down**: Serviço não responde por > 1 minuto
- **High Error Rate**: > 5% de erros em 5 minutos
- **High Latency**: > 500ms para 95% das requisições
- **High Memory Usage**: > 90% de uso de memória

#### **Warning Alerts**
- **Service Slow**: Tempo de resposta > 200ms
- **High CPU Usage**: > 80% de uso de CPU
- **Disk Space**: > 85% de uso de disco
- **Connection Pool**: > 80% de conexões ativas

---

## 🚪 **KONG API GATEWAY - MONITORAMENTO**

### **Métricas Disponíveis**
- **Request Count**: Total de requisições por rota
- **Request Size**: Tamanho das requisições
- **Response Time**: Latência por serviço
- **Upstream Health**: Status dos serviços upstream
- **Plugin Metrics**: Métricas dos plugins (rate limiting, CORS)

### **Endpoints de Monitoramento**
- **Status**: `GET /status` - Saúde geral do Kong
- **Services**: `GET /services` - Lista de serviços
- **Routes**: `GET /routes` - Lista de rotas
- **Plugins**: `GET /plugins` - Lista de plugins ativos

### **Configurações de Segurança**
- **Rate Limiting**: Por IP e por rota
- **CORS**: Configurado por serviço
- **Security Headers**: XSS, CSRF, Clickjacking
- **IP Restrictions**: Restrições opcionais por IP

---

## ⚖️ **HAPROXY - LOAD BALANCER**

### **Configuração**
- **Porta HTTP**: 80
- **Porta HTTPS**: 443
- **Stats**: 8404 (admin/admin123)
- **Configuração**: `haproxy/haproxy.cfg`

### **Funcionalidades**
- **Health Checks**: Verificação automática de saúde
- **Load Balancing**: Round-robin entre instâncias
- **SSL Termination**: Suporte a HTTPS
- **Rate Limiting**: Limite de 100 req/min por IP
- **Path-based Routing**: Roteamento por caminho da URL

### **Backends Configurados**
- **Frontend Service**: Porta 3000
- **API Gateway**: Kong na porta 8000
- **Health Service**: Porta 3004
- **Metrics Service**: Prometheus na porta 9090
- **Admin Service**: Kong Admin na porta 8001/8002

---

## 🧪 **TESTES E VALIDAÇÃO**

### **Scripts de Teste Disponíveis**

#### **1. Testes de Conectividade**
```bash
./scripts/test-connectivity.sh
```
- Testa conectividade entre todos os serviços
- Verifica health checks
- Valida comunicação de rede

#### **2. Testes do API Gateway**
```bash
./scripts/test-api-gateway.sh
```
- Testa roteamento do Kong
- Valida rate limiting
- Verifica CORS e headers de segurança

#### **3. Testes de Métricas**
```bash
./scripts/test-metrics-collection.sh
```
- Valida coleta do Prometheus
- Testa dashboards do Grafana
- Verifica métricas dos serviços

### **Comandos de Validação Manual**

#### **Prometheus**
```bash
# Health check
curl http://localhost:9090/-/healthy

# Status
curl http://localhost:9090/api/v1/status/config

# Targets
curl http://localhost:9090/api/v1/targets

# Query básica
curl "http://localhost:9090/api/v1/query?query=up"
```

#### **Grafana**
```bash
# Health check
curl http://localhost:3000/api/health

# Datasources
curl http://localhost:3000/api/datasources

# Dashboards
curl http://localhost:3000/api/search
```

#### **Kong**
```bash
# Status
curl http://localhost:8001/status

# Services
curl http://localhost:8001/services

# Routes
curl http://localhost:8001/routes
```

#### **HAProxy**
```bash
# Stats (requer autenticação)
curl -u admin:admin123 http://localhost:8404/stats

# Health check
curl http://localhost/health
```

---

## 📈 **MÉTRICAS DE PERFORMANCE**

### **Objetivos de SLA**
- **Uptime**: > 99.9%
- **Response Time**: < 200ms (95%)
- **Error Rate**: < 0.1%
- **Recovery Time**: < 2 minutos

### **KPIs Monitorados**
- **Throughput**: Requisições por segundo
- **Latency**: Tempo de resposta médio e percentis
- **Availability**: Tempo de funcionamento
- **Reliability**: Taxa de sucesso das requisições

### **Alertas de Performance**
- **High Latency**: > 500ms para 95% das req
- **Low Throughput**: < 100 req/s por serviço
- **High Error Rate**: > 1% de erros
- **Service Degradation**: Degradação gradual detectada

---

## 🔧 **MANUTENÇÃO E OPERAÇÃO**

### **Backup e Restore**
- **Prometheus**: Backup automático das métricas
- **Grafana**: Backup dos dashboards e configurações
- **Configurações**: Versionadas no Git

### **Escalabilidade**
- **Horizontal**: Adicionar réplicas dos serviços
- **Vertical**: Aumentar recursos dos containers
- **Storage**: Aumentar volumes de dados

### **Troubleshooting**
- **Logs**: Centralizados por serviço
- **Métricas**: Histórico de 200 horas
- **Alertas**: Notificações em tempo real
- **Dashboards**: Visão em tempo real do sistema

---

## 🚀 **PRÓXIMOS PASSOS**

### **Melhorias Planejadas**
1. **Alerting Manager**: Sistema de notificações
2. **Log Aggregation**: Centralização de logs (ELK)
3. **Distributed Tracing**: OpenTelemetry
4. **Custom Dashboards**: Dashboards específicos por clínica
5. **Machine Learning**: Detecção automática de anomalias

### **Integrações Futuras**
- **Slack**: Notificações de alertas
- **Email**: Relatórios diários/semanais
- **PagerDuty**: Escalação de incidentes
- **Jira**: Criação automática de tickets

---

**Documento criado em:** 2024-01-15  
**Versão:** 1.0.0  
**Status:** IMPLEMENTADO  
**Próxima revisão:** Após testes de produção
