#!/bin/bash

# =====================================================
# SCRIPT PARA INICIAR INFRAESTRUTURA - ATENDEAI 2.0
# =====================================================

echo "🚀 Iniciando Infraestrutura AtendeAI 2.0..."

# Verificar se o Docker está rodando
if ! docker info &> /dev/null; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker Desktop primeiro."
    exit 1
fi

# Verificar se o Docker Compose está disponível
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está disponível. Verifique a instalação do Docker."
    exit 1
fi

# Parar containers existentes (se houver)
echo "🛑 Parando containers existentes..."
docker-compose down

# Limpar volumes (opcional - descomente se necessário)
# echo "🧹 Limpando volumes..."
# docker-compose down -v

# Construir e iniciar todos os serviços
echo "🔨 Construindo e iniciando serviços..."
docker-compose up -d --build

# Aguardar um pouco para os serviços iniciarem
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Verificar status dos serviços
echo "📊 Verificando status dos serviços..."
docker-compose ps

# Verificar logs dos serviços principais
echo "📝 Verificando logs dos serviços principais..."
echo ""
echo "🔍 Redis:"
docker-compose logs --tail=5 redis

echo ""
echo "🔍 Kong API Gateway:"
docker-compose logs --tail=5 kong

echo ""
echo "🔍 Auth Service:"
docker-compose logs --tail=5 auth-service

echo ""
echo "🔍 Clinic Service:"
docker-compose logs --tail=5 clinic-service

echo ""
echo "🔍 Conversation Service:"
docker-compose logs --tail=5 conversation-service

echo ""
echo "🔍 Appointment Service:"
docker-compose logs --tail=5 appointment-service

echo ""
echo "🔍 WhatsApp Service:"
docker-compose logs --tail=5 whatsapp-service

echo ""
echo "🔍 Google Calendar Service:"
docker-compose logs --tail=5 google-calendar-service

echo ""
echo "🔍 Health Service:"
docker-compose logs --tail=5 health-service

echo ""
echo "🔍 HAProxy:"
docker-compose logs --tail=5 haproxy

echo ""
echo "🔍 Prometheus:"
docker-compose logs --tail=5 prometheus

echo ""
echo "🔍 Grafana:"
docker-compose logs --tail=5 grafana

echo ""
echo "✅ Infraestrutura iniciada com sucesso!"
echo ""
echo "🌐 URLs dos serviços:"
echo "   - Frontend (HAProxy): http://localhost"
echo "   - Kong API Gateway: http://localhost:8000"
echo "   - Kong Admin: http://localhost:8001"
echo "   - Kong GUI: http://localhost:8002"
echo "   - Prometheus: http://localhost:9090"
echo "   - Grafana: http://localhost:3000 (admin/admin123)"
echo ""
echo "🔧 Serviços individuais:"
echo "   - Auth Service: http://localhost:3001"
echo "   - User Service: http://localhost:3002"
echo "   - Clinic Service: http://localhost:3003"
echo "   - Health Service: http://localhost:3004"
echo "   - Conversation Service: http://localhost:3005"
echo "   - Appointment Service: http://localhost:3006"
echo "   - WhatsApp Service: http://localhost:3007"
echo "   - Google Calendar Service: http://localhost:3008"
echo ""
echo "📊 Para ver logs em tempo real:"
echo "   docker-compose logs -f [nome-do-serviço]"
echo ""
echo "🛑 Para parar a infraestrutura:"
echo "   docker-compose down"
