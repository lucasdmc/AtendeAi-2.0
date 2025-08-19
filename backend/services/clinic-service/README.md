# 🏥 AtendeAI Clinic Service

Serviço de gestão de clínicas multi-tenant para o sistema AtendeAI 2.0, implementando funcionalidades avançadas de contextualização e configuração por clínica.

## 🎯 **Funcionalidades Principais**

### **Gestão de Clínicas Multi-tenant**
- ✅ CRUD completo de clínicas
- ✅ Isolamento completo entre clínicas
- ✅ Configurações específicas por clínica
- ✅ Sistema de status (ativo, inativo, suspenso)

### **Sistema de Contextualização JSON Avançado** 🚀
- ✅ **Carregamento dinâmico** de JSONs de contextualização
- ✅ **Extração automática de intenções** de todos os campos
- ✅ **Cache inteligente** com Redis para performance
- ✅ **Fallbacks robustos** para campos não preenchidos
- ✅ **Validação completa** de estrutura JSON
- ✅ **Personalidade da IA** configurável por clínica
- ✅ **Comportamento da IA** personalizável
- ✅ **Horários de funcionamento** com mapeamento de dias
- ✅ **Políticas de agendamento** específicas por clínica

### **Gestão de Profissionais**
- ✅ CRUD de profissionais por clínica
- ✅ Especialidades e experiência
- ✅ Horários de trabalho personalizados
- ✅ Controle de aceitação de novos pacientes

### **Gestão de Serviços**
- ✅ CRUD de serviços por clínica
- ✅ Categorias e especialidades
- ✅ Preços e convênios
- ✅ Duração configurável

### **Sistema de Cache**
- ✅ Cache Redis para contextualizações
- ✅ TTL configurável
- ✅ Invalidação automática
- ✅ Estatísticas de cache

## 🏗️ **Arquitetura**

### **Estrutura do Projeto**
```
src/
├── config/           # Configurações (DB, Redis, JWT)
├── controllers/      # Controladores da API
├── middleware/       # Middlewares (Auth, Validação, Rate Limit)
├── models/          # Modelos de dados
├── routes/          # Definição de rotas
├── services/        # Lógica de negócio
└── utils/           # Utilitários (Logger)
```

### **Tecnologias**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis
- **Autenticação**: JWT
- **Validação**: Joi
- **Logging**: Winston
- **Containerização**: Docker

## 🚀 **Instalação e Execução**

### **Pré-requisitos**
- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- Docker (opcional)

### **Instalação Local**
```bash
cd services/clinic-service

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Executar em desenvolvimento
npm run dev

# Executar em produção
npm start
```

### **Execução com Docker**
```bash
# Construir imagem
docker build -t atendeai-clinic-service .

# Executar container
docker run -p 3002:3002 \
  -e DB_HOST=your-db-host \
  -e REDIS_HOST=your-redis-host \
  atendeai-clinic-service
```

## 📡 **API Endpoints**

### **Clínicas**
```
POST   /api/clinics                    # Criar clínica
GET    /api/clinics                    # Listar clínicas
GET    /api/clinics/:id               # Obter clínica
PUT    /api/clinics/:id               # Atualizar clínica
DELETE /api/clinics/:id               # Deletar clínica
GET    /api/clinics/whatsapp/:phone   # Buscar por WhatsApp
```

### **Contextualização** 🎯
```
GET    /api/clinics/:id/contextualization           # Obter contextualização
PUT    /api/clinics/:id/contextualization           # Atualizar contextualização
GET    /api/clinics/:id/intentions                  # Extrair intenções
GET    /api/clinics/:id/personality                 # Obter personalidade da IA
GET    /api/clinics/:id/behavior                    # Obter comportamento da IA
GET    /api/clinics/:id/working-hours               # Obter horários
GET    /api/clinics/:id/appointment-policies        # Obter políticas
GET    /api/clinics/:id/calendar-mappings          # Obter mapeamentos
GET    /api/clinics/:id/services                    # Obter serviços
GET    /api/clinics/:id/professionals               # Obter profissionais
```

### **Cache**
```
DELETE /api/clinics/:id/contextualization/cache     # Limpar cache
GET    /api/clinics/contextualization/cache/stats   # Estatísticas do cache
```

### **Profissionais**
```
POST   /api/clinics/:clinicId/professionals        # Criar profissional
GET    /api/clinics/:clinicId/professionals        # Listar profissionais
GET    /api/clinics/:clinicId/professionals/:id    # Obter profissional
PUT    /api/clinics/:clinicId/professionals/:id    # Atualizar profissional
DELETE /api/clinics/:clinicId/professionals/:id    # Deletar profissional
```

### **Serviços**
```
POST   /api/clinics/:clinicId/services              # Criar serviço
GET    /api/clinics/:clinicId/services              # Listar serviços
GET    /api/clinics/:clinicId/services/:id          # Obter serviço
PUT    /api/clinics/:clinicId/services/:id          # Atualizar serviço
DELETE /api/clinics/:clinicId/services/:id          # Deletar serviço
```

### **Saúde**
```
GET    /health                    # Health check
GET    /health/ready             # Readiness check
GET    /health/live              # Liveness check
GET    /health/metrics           # Métricas do serviço
```

## 🔐 **Autenticação e Autorização**

### **JWT Token**
- **Header**: `Authorization: Bearer <token>`
- **Expiração**: 24 horas (configurável)
- **Refresh**: 7 dias (configurável)

### **Controle de Acesso**
- **Isolamento por clínica**: Usuários só acessam dados da sua clínica
- **Roles**: admin, manager, user
- **Rate Limiting**: Configurável por role

## 📊 **Sistema de Contextualização**

### **Estrutura JSON Esperada**
```json
{
  "clinic_info": {
    "name": "Nome da Clínica",
    "type": "clinic",
    "specialty": "Cardiologia"
  },
  "ai_personality": {
    "name": "Dr. Assistente",
    "tone": "friendly",
    "formality": "medium",
    "languages": ["pt-BR"],
    "greeting": "Olá! Como posso ajudá-lo?",
    "farewell": "Obrigado! Tenha um ótimo dia!",
    "out_of_hours": "Estamos fora do horário..."
  },
  "ai_behavior": {
    "proactivity": "medium",
    "suggestions": true,
    "auto_escalation": true,
    "escalation_threshold": 3
  },
  "working_hours": {
    "segunda": [{"start": "08:00", "end": "18:00"}],
    "terca": [{"start": "08:00", "end": "18:00"}]
  },
  "services": [
    {
      "id": "service-1",
      "name": "Consulta Cardiológica",
      "category": "consultation",
      "duration": 30,
      "price": 150.00
    }
  ],
  "professionals": [
    {
      "id": "prof-1",
      "name": "Dr. João Silva",
      "specialties": ["Cardiologia"],
      "accepts_new_patients": true
    }
  ],
  "appointment_policies": {
    "min_advance_notice": 24,
    "max_advance_notice": 30,
    "default_slot_duration": 30,
    "max_daily_appointments": 50
  }
}
```

### **Extração de Intenções**
O sistema **automaticamente extrai** todas as informações do JSON como intenções válidas, exceto:
- Campos que começam com `_`
- Campos que começam com `config_`
- `agent_config`
- `system_config`

## 🧪 **Testes**

### **Executar Testes**
```bash
# Testes unitários
npm test

# Testes com coverage
npm run test:coverage

# Testes de integração
npm run test:integration
```

### **Testes de Performance**
```bash
# Teste de carga
npm run test:load

# Teste de stress
npm run test:stress
```

## 📈 **Monitoramento**

### **Métricas Disponíveis**
- **Performance**: Tempo de resposta, throughput
- **Recursos**: CPU, memória, conexões de banco
- **Cache**: Hit ratio, TTL, tamanho
- **Erros**: Taxa de erro, tipos de erro

### **Health Checks**
- **Liveness**: Serviço está rodando
- **Readiness**: Dependências estão prontas
- **Health**: Status geral do serviço

## 🔧 **Configuração**

### **Variáveis de Ambiente**
```bash
# Serviço
CLINIC_SERVICE_PORT=3002
NODE_ENV=development

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=atendeai
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=3600

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## 🚨 **Tratamento de Erros**

### **Códigos de Status**
- **200**: Sucesso
- **201**: Criado
- **400**: Dados inválidos
- **401**: Não autenticado
- **403**: Não autorizado
- **404**: Não encontrado
- **429**: Rate limit excedido
- **500**: Erro interno
- **503**: Serviço indisponível

### **Logs Estruturados**
- **Nível**: debug, info, warn, error
- **Formato**: JSON
- **Campos**: timestamp, level, message, metadata
- **Correlação**: Request ID para rastreamento

## 🔄 **Deploy e CI/CD**

### **Docker Compose**
```yaml
clinic-service:
  build: ./services/clinic-service
  ports:
    - "3002:3002"
  environment:
    - DB_HOST=postgres
    - REDIS_HOST=redis
  depends_on:
    - postgres
    - redis
```

### **Kubernetes**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: clinic-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: clinic-service
  template:
    metadata:
      labels:
        app: clinic-service
    spec:
      containers:
      - name: clinic-service
        image: atendeai/clinic-service:latest
        ports:
        - containerPort: 3002
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3002
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3002
```

## 📚 **Documentação Adicional**

- [Especificação da API](docs/api-specification.md)
- [Guia de Contextualização](docs/contextualization-guide.md)
- [Arquitetura do Sistema](docs/architecture.md)
- [Guia de Deploy](docs/deployment-guide.md)

## 🤝 **Contribuição**

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 **Licença**

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 **Suporte**

- **Issues**: [GitHub Issues](https://github.com/atendeai/atendeai-2.0/issues)
- **Documentação**: [Wiki](https://github.com/atendeai/atendeai-2.0/wiki)
- **Email**: suporte@atendeai.com.br

---

**Desenvolvido com ❤️ pela equipe AtendeAI**
