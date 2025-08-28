# 📊 MONITORING & OBSERVABILITY - ATENDEAI 2.0

---

## 🎯 **VISÃO GERAL DO MONITORAMENTO**

O sistema AtendeAI 2.0 possui um **sistema de monitoramento completo e profissional** implementado com Prometheus, Grafana, e métricas customizadas para todos os serviços.

---

## 🏗️ **ARQUITETURA DE MONITORAMENTO**

### **Componentes Implementados**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Prometheus    │    │     Grafana     │    │   HAProxy      │
│   (Port 9090)   │◄──►│   (Port 3000)   │◄──►│   (Port 80)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MICROSERVICES LAYER                         │
├─────────────────┬─────────────────┬─────────────────┬─────────┤
│     Auth via    │  User Service   │  Clinic Service │  ...   │
│    Supabase     │  (Port 3002)    │  (Port 3003)    │        │
└─────────────────┴─────────────────┴─────────────────┴─────────┘
```

---

## 📊 **PROMETHEUS CONFIGURADO**

### **Configuração Principal**
- **Porta**: 9090
- **Retenção**: 15 dias
- **Scrape Interval**: 15s
- **Targets**: Todos os serviços backend

### **Métricas Coletadas**
- **Sistema**: CPU, RAM, Disco, Rede
- **Aplicação**: Response time, Throughput, Error rate
- **Banco de Dados**: Connections, Queries, Performance
- **Cache**: Hit ratio, Memory usage, Operations
- **API Gateway**: Rate limiting, Latency, Status codes

### **Alertas Configurados**
- **High CPU Usage**: > 80% por 5 minutos
- **High Memory Usage**: > 85% por 5 minutos
- **Service Down**: Health check falhou por 2 minutos
- **High Error Rate**: > 5% por 1 minuto
- **Database Slow**: Query time > 2 segundos

---

## 📈 **GRAFANA DASHBOARDS**

### **Dashboard Principal - AtendeAI Overview**
- **URL**: http://localhost:3000
- **Credenciais**: admin/admin123
- **Métricas Exibidas**:
  - Status geral dos serviços
  - Performance em tempo real
  - Uso de recursos
  - Taxa de erros
  - Latência das APIs

### **Dashboards Específicos**
1. **Infrastructure Overview**
   - Status dos containers Docker
   - Uso de recursos do sistema
   - Health checks dos serviços

2. **Application Performance**
   - Response time das APIs
   - Throughput por serviço
   - Error rates e status codes

3. **Database Performance**
   - Conexões ativas
   - Query performance
   - Cache hit ratio

4. **Business Metrics**
   - Agendamentos por hora
   - Conversas ativas
   - Taxa de conversão

---

## 🔍 **MÉTRICAS CUSTOMIZADAS**

### **Métricas de Negócio**
```javascript
// Exemplo de métricas customizadas
const businessMetrics = {
  appointments_created_total: new Counter({
    name: 'appointments_created_total',
    help: 'Total de agendamentos criados',
    labelNames: ['clinic_id', 'service_type']
  }),
  
  conversation_duration_seconds: new Histogram({
    name: 'conversation_duration_seconds',
    help: 'Duração das conversas em segundos',
    labelNames: ['clinic_id', 'intent_type']
  }),
  
  whatsapp_messages_total: new Counter({
    name: 'whatsapp_messages_total',
    help: 'Total de mensagens WhatsApp',
    labelNames: ['clinic_id', 'direction', 'status']
  })
};
```

### **Métricas de Sistema**
- **Container Health**: Status de todos os serviços Docker
- **Resource Usage**: CPU, RAM, Disco por container
- **Network Traffic**: Bytes in/out por serviço
- **Error Rates**: HTTP status codes, exceptions

---

## 🚨 **SISTEMA DE ALERTAS**

### **Alertas Críticos (P0)**
- **Service Down**: Notificação imediata
- **Database Connection Failed**: Escalação automática
- **High Error Rate**: Intervenção imediata

### **Alertas Importantes (P1)**
- **High Resource Usage**: Monitoramento contínuo
- **Performance Degradation**: Análise e otimização
- **Cache Miss Rate**: Investigação de performance

### **Alertas Informativos (P2)**
- **New Deploy**: Notificação de mudanças
- **Configuration Changes**: Auditoria de alterações
- **Backup Status**: Confirmação de backups

---

## 📝 **LOGGING E TRACING**

### **Logs Estruturados**
- **Formato**: JSON com campos padronizados
- **Níveis**: ERROR, WARN, INFO, DEBUG
- **Campos**: timestamp, level, service, message, context

### **Correlation IDs**
- **Rastreamento**: Todas as requisições
- **Contexto**: Clínica, usuário, sessão
- **Performance**: Tempo de resposta por operação

### **Exemplo de Log**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "service": "auth",
  "correlation_id": "req-12345",
  "clinic_id": "clinic-67890",
  "user_id": "user-abc123",
  "message": "User authentication successful",
  "context": {
    "ip": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "duration_ms": 45
  }
}
```

---

## 🔧 **CONFIGURAÇÃO DE SERVIÇOS**

### **Health Checks**
Todos os serviços implementam health checks padronizados:

```javascript
// Endpoint de health check
app.get('/health', async (req, res) => {
  try {
    // Verificar banco de dados
    await db.query('SELECT 1');
    
    // Verificar cache
    await redis.ping();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

### **Métricas de Health Check**
- **Response Time**: Tempo de resposta do health check
- **Status**: Healthy/Unhealthy
- **Dependencies**: Status de banco, cache, APIs externas

---

## 📊 **DASHBOARDS AUTOMÁTICOS**

### **Provisionamento Automático**
- **Grafana**: Dashboards criados automaticamente
- **Prometheus**: Targets configurados via Docker
- **Alertas**: Regras aplicadas automaticamente

### **Configuração via Docker**
```yaml
# docker-compose.yml
grafana:
  environment:
    GF_SECURITY_ADMIN_PASSWORD: admin123
  volumes:
    - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
```

---

## 🚀 **COMO ACESSAR**

### **URLs de Acesso**
- **Grafana**: http://localhost:3000 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **HAProxy Stats**: http://localhost:80/stats

### **Comandos Úteis**
```bash
# Verificar status dos serviços
docker-compose ps

# Ver logs do Prometheus
docker-compose logs prometheus

# Ver logs do Grafana
docker-compose logs grafana

# Reiniciar monitoramento
docker-compose restart prometheus grafana
```

---

## 📈 **MÉTRICAS DE PERFORMANCE**

### **SLAs Configurados**
- **Response Time**: < 200ms para 95% das requisições
- **Uptime**: > 99.9%
- **Error Rate**: < 0.1%
- **Recovery Time**: < 2 minutos

### **KPIs Monitorados**
- **Throughput**: Requisições por segundo
- **Latency**: P50, P95, P99
- **Availability**: Tempo de atividade
- **Reliability**: Taxa de sucesso

---

## 🔮 **ROADMAP DE MONITORAMENTO**

### **Próximas Funcionalidades**
1. **APM Integration**: New Relic ou DataDog
2. **Log Aggregation**: ELK Stack ou Loki
3. **Distributed Tracing**: Jaeger ou Zipkin
4. **Machine Learning**: Anomaly detection
5. **Auto-scaling**: Baseado em métricas

### **Melhorias Planejadas**
- **Custom Dashboards**: Por clínica e usuário
- **Business Intelligence**: Relatórios avançados
- **Predictive Analytics**: Previsão de problemas
- **Mobile Alerts**: Notificações push

---

## 🎯 **CONCLUSÃO**

O sistema de monitoramento do AtendeAI 2.0 está **completamente implementado** e oferece:

- ✅ **Observabilidade completa** de todos os serviços
- ✅ **Alertas inteligentes** para problemas críticos
- ✅ **Dashboards profissionais** para análise
- ✅ **Métricas customizadas** de negócio
- ✅ **Logs estruturados** para debugging
- ✅ **Health checks** para todos os serviços

---

**Status**: 🟢 COMPLETO  
**Última atualização**: 2024-01-15  
**Versão**: 1.0.0  
**Próxima revisão**: Após implementação dos serviços core
