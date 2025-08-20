# 📊 ENTREGÁVEL 6: MONITORING SERVICE - ATENDEAI 2.0

---

## 🎯 **OBJETIVO**

Implementar o **Monitoring Service** completo com sistema de observabilidade, métricas, alertas e dashboards para monitorar todo o sistema AtendeAI 2.0.

---

## 📋 **ESCOPO DO ENTREGÁVEL**

### **Sistema de Métricas**
- [ ] Coleta de métricas de sistema (CPU, RAM, Disco)
- [ ] Métricas de aplicação (response time, throughput)
- [ ] Métricas de negócio (agendamentos, conversas)
- [ ] Métricas de banco de dados e cache

### **Sistema de Alertas**
- [ ] Alertas automáticos baseados em thresholds
- [ ] Notificações por email, Slack, WhatsApp
- [ ] Escalação automática de alertas críticos
- [ ] Dashboard de status dos alertas

### **Dashboards e Visualização**
- [ ] Dashboard geral da infraestrutura
- [ ] Dashboards específicos por serviço
- [ ] Gráficos em tempo real
- [ ] Relatórios históricos

---

## 🏗️ **ARQUITETURA DO SERVIÇO**

### **Componentes Principais**
```
┌─────────────────────────────────────────────────────────────────┐
│                  MONITORING SERVICE                            │
├─────────────────┬─────────────────┬─────────────────┬─────────┤
│  Metrics        │  Alerting       │  Dashboard      │  Log    │
│  Collector      │   Engine        │   Manager       │Manager  │
├─────────────────┼─────────────────┼─────────────────┼─────────┤
│  Prometheus     │  AlertManager   │  Grafana        │  ELK    │
│  Integration    │  Integration    │  Integration    │ Stack   │
└─────────────────┴─────────────────┴─────────────────┴─────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  INFRASTRUCTURE LAYER                          │
├─────────────────┬─────────────────┬─────────────────┬─────────┤
│   PostgreSQL    │     Redis       │   Prometheus    │ Grafana │
│   (Database)    │    (Cache)      │   (Metrics)     │ (UI)    │
└─────────────────┴─────────────────┴─────────────────┴─────────┘
```

---

## 🗄️ **MODELOS DE DADOS**

### **Métricas do Sistema**
```sql
-- Métricas de sistema
CREATE TABLE monitoring.system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES atendeai.clinics(id),
    service_name VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    metric_unit VARCHAR(20),
    tags JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Métricas de aplicação
CREATE TABLE monitoring.application_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES atendeai.clinics(id),
    service_name VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255),
    response_time_ms INTEGER,
    status_code INTEGER,
    error_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alertas
CREATE TABLE monitoring.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES atendeai.clinics(id),
    alert_name VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);
```

---

## 📊 **SISTEMA DE MÉTRICAS**

### **Prometheus Integration**
```javascript
class MetricsCollector {
  constructor() {
    this.prometheus = require('prom-client');
    this.registry = new this.prometheus.Registry();
    
    // Métricas de sistema
    this.cpuUsage = new this.prometheus.Gauge({
      name: 'system_cpu_usage_percent',
      help: 'CPU usage percentage',
      labelNames: ['service', 'clinic_id']
    });
    
    this.memoryUsage = new this.prometheus.Gauge({
      name: 'system_memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['service', 'clinic_id']
    });
    
    this.responseTime = new this.prometheus.Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code', 'service']
    });
    
    this.registry.registerMetric(this.cpuUsage);
    this.registry.registerMetric(this.memoryUsage);
    this.registry.registerMetric(this.responseTime);
  }

  // Coletar métricas do sistema
  async collectSystemMetrics() {
    const os = require('os');
    
    // CPU
    const cpuUsage = os.loadavg()[0] * 100;
    this.cpuUsage.set({ service: process.env.SERVICE_NAME }, cpuUsage);
    
    // Memória
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    this.memoryUsage.set({ service: process.env.SERVICE_NAME }, usedMem);
  }

  // Coletar métricas de aplicação
  recordRequestDuration(method, route, statusCode, duration) {
    this.responseTime.observe(
      { method, route, status_code: statusCode, service: process.env.SERVICE_NAME },
      duration / 1000 // Converter para segundos
    );
  }
}
```

---

## 🚨 **SISTEMA DE ALERTAS**

### **Alert Manager**
```javascript
class AlertManager {
  constructor() {
    this.alertRules = new Map();
    this.activeAlerts = new Map();
    this.loadAlertRules();
  }

  // Definir regra de alerta
  defineAlertRule(name, condition, severity, message) {
    this.alertRules.set(name, {
      condition,
      severity,
      message,
      enabled: true
    });
  }

  // Verificar condições de alerta
  async checkAlertConditions() {
    for (const [name, rule] of this.alertRules.entries()) {
      if (!rule.enabled) continue;
      
      try {
        const shouldAlert = await rule.condition();
        
        if (shouldAlert && !this.activeAlerts.has(name)) {
          await this.triggerAlert(name, rule);
        } else if (!shouldAlert && this.activeAlerts.has(name)) {
          await this.resolveAlert(name);
        }
      } catch (error) {
        console.error(`Error checking alert rule ${name}:`, error);
      }
    }
  }

  // Disparar alerta
  async triggerAlert(name, rule) {
    const alert = {
      id: uuid(),
      name,
      severity: rule.severity,
      message: rule.message,
      status: 'active',
      created_at: new Date(),
      metadata: {}
    };
    
    this.activeAlerts.set(name, alert);
    
    // Salvar no banco
    await this.saveAlert(alert);
    
    // Enviar notificação
    await this.sendNotification(alert);
    
    console.log(`🚨 ALERTA DISPARADO: ${name} - ${rule.severity}`);
  }

  // Resolver alerta
  async resolveAlert(name) {
    const alert = this.activeAlerts.get(name);
    if (!alert) return;
    
    alert.status = 'resolved';
    alert.resolved_at = new Date();
    
    // Atualizar no banco
    await this.updateAlert(alert);
    
    // Remover da lista ativa
    this.activeAlerts.delete(name);
    
    console.log(`✅ ALERTA RESOLVIDO: ${name}`);
  }
}
```

---

## 📈 **DASHBOARDS E VISUALIZAÇÃO**

### **Grafana Integration**
```javascript
class DashboardManager {
  constructor() {
    this.grafanaUrl = process.env.GRAFANA_URL;
    this.grafanaToken = process.env.GRAFANA_TOKEN;
  }

  // Criar dashboard padrão
  async createDefaultDashboard(clinicId) {
    const dashboard = {
      title: `AtendeAI - Clínica ${clinicId}`,
      panels: [
        {
          title: 'CPU Usage',
          type: 'graph',
          targets: [
            {
              expr: 'system_cpu_usage_percent{clinic_id="' + clinicId + '"}',
              legendFormat: '{{service}}'
            }
          ]
        },
        {
          title: 'Memory Usage',
          type: 'graph',
          targets: [
            {
              expr: 'system_memory_usage_bytes{clinic_id="' + clinicId + '"}',
              legendFormat: '{{service}}'
            }
          ]
        },
        {
          title: 'Response Time',
          type: 'graph',
          targets: [
            {
              expr: 'rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])',
              legendFormat: '{{service}} - {{route}}'
            }
          ]
        }
      ]
    };
    
    return await this.createGrafanaDashboard(dashboard);
  }
}
```

---

## 🔧 **IMPLEMENTAÇÃO TÉCNICA**

### **Estrutura de Arquivos**
```
monitoring-service/
├── src/
│   ├── controllers/
│   │   ├── metricsController.js
│   │   ├── alertsController.js
│   │   └── dashboardController.js
│   ├── services/
│   │   ├── metricsService.js
│   │   ├── alertsService.js
│   │   └── dashboardService.js
│   ├── models/
│   │   ├── systemMetrics.js
│   │   ├── applicationMetrics.js
│   │   └── alerts.js
│   ├── routes/
│   │   ├── metrics.js
│   │   ├── alerts.js
│   │   └── dashboard.js
│   └── config/
│       ├── database.js
│       ├── prometheus.js
│       └── grafana.js
├── Dockerfile
└── package.json
```

---

## 🎯 **CRITÉRIOS DE ACEITAÇÃO**

### **Funcionalidade**
- [ ] Coleta de métricas funcionando
- [ ] Sistema de alertas operacional
- [ ] Dashboards configurados
- [ ] Integração com Prometheus/Grafana

### **Performance**
- [ ] Coleta de métricas < 100ms
- [ ] Alertas em tempo real
- [ ] Dashboards responsivos
- [ ] Uptime > 99.9%

---

## 🏆 **CONCLUSÃO**

O **Entregável 6: Monitoring Service** implementa o sistema completo de observabilidade e monitoramento do AtendeAI 2.0.

### **Status Final**
**🔄 ENTREGÁVEL 6 EM DESENVOLVIMENTO**  
**📋 PRONTO PARA IMPLEMENTAÇÃO**

---

**Documento**: specification.md  
**Entregável**: 06-monitoring  
**Status**: 🔄 EM DESENVOLVIMENTO  
**Data**: 2024-01-15  
**Versão**: 1.0.0
