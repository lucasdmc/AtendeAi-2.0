#!/bin/bash
# =====================================================
# CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE - RAILWAY
# ATENDEAI 2.0 - MICROSERVIÇOS
# =====================================================

echo "Configurando variáveis de ambiente no Railway..."

# URL base da aplicação principal
RAILWAY_BASE_URL="https://atendeai-20-production.up.railway.app"

# Configurar variáveis de ambiente para o frontend
echo "Configurando variáveis do frontend..."

# Supabase
railway variables set VITE_SUPABASE_URL="https://kytphnasmdvebmdvvwtx.supabase.co"
railway variables set VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9lIjoiYW5vbiIsImlhdCI6MTc1NTYyMjgxMCwiZXhwIjoyMDcxMTk4ODEwfQ.gfH3VNqxLZWAbjlrlk44VrBdyF1QKv7CyOSLmhFwbqA"

# Configurações gerais
railway variables set NODE_ENV="production"
railway variables set VITE_APP_VERSION="1.4.0"
railway variables set VITE_API_BASE_URL="$RAILWAY_BASE_URL"

# Configurações de rede
railway variables set PORT="3000"
railway variables set HOST="0.0.0.0"

# Configurações de segurança
railway variables set JWT_SECRET="your-super-secret-jwt-key-change-in-production"
railway variables set JWT_ACCESS_TOKEN_EXPIRY="15m"
railway variables set JWT_REFRESH_TOKEN_EXPIRY="7d"
railway variables set BCRYPT_ROUNDS="12"

# URLs dos microserviços - usando a mesma URL base com portas diferentes
railway variables set VITE_AUTH_SERVICE_URL="$RAILWAY_BASE_URL:3001"
railway variables set VITE_USER_SERVICE_URL="$RAILWAY_BASE_URL:3002"
railway variables set VITE_CLINIC_SERVICE_URL="$RAILWAY_BASE_URL:3003"
railway variables set VITE_CONVERSATION_SERVICE_URL="$RAILWAY_BASE_URL:3005"
railway variables set VITE_APPOINTMENT_SERVICE_URL="$RAILWAY_BASE_URL:3006"
railway variables set VITE_WHATSAPP_SERVICE_URL="$RAILWAY_BASE_URL:3007"
railway variables set VITE_GOOGLE_CALENDAR_SERVICE_URL="$RAILWAY_BASE_URL:3008"

# Configurações do banco de dados
railway variables set DATABASE_URL="postgresql://postgres:Supa201294base@db.kytphnasmdvebmdvvwtx.supabase.co:5432/postgres"
railway variables set SUPABASE_URL="https://kytphnasmdvebmdvvwtx.supabase.co"
railway variables set SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9lIjoiYW5vbiIsImlhdCI6MTc1NTYyMjgxMCwiZXhwIjoyMDcxMTk4ODEwfQ.gfH3VNqxLZWAbjlrlk44VrBdyF1QKv7CyOSLmhFwbqA"
railway variables set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9lIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzU1NjIyODEwLCJleHAiOjIwNzExOTg4MTB9LjM2SXA5Tld2cWg2YWVGUXVvd1Y3OXI1NEMyWVFQYzVOLU1uX2RuMlFENzA"

# Configurações WhatsApp
railway variables set WHATSAPP_WEBHOOK_VERIFY_TOKEN="atendeai_webhook_verify_2024"
railway variables set WHATSAPP_API_VERSION="v18.0"
railway variables set WHATSAPP_BASE_URL="https://graph.facebook.com"
railway variables set WHATSAPP_WEBHOOK_PATH="/webhook/whatsapp"
railway variables set WHATSAPP_MAX_RETRIES="3"
railway variables set WHATSAPP_RETRY_DELAY="1000"
railway variables set WEBHOOK_SIGNATURE_SECRET="atendeai_webhook_signature_secret_2024"

# Configurações Google Calendar
railway variables set GOOGLE_CLIENT_ID="367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com"
railway variables set GOOGLE_CLIENT_SECRET="GOCSPX-your_client_secret_here"
railway variables set GOOGLE_REDIRECT_URI="$RAILWAY_BASE_URL/auth/google/callback"
railway variables set GOOGLE_API_KEY="your_google_api_key_here"
railway variables set GOOGLE_CALENDAR_ID="primary"
railway variables set GOOGLE_TIMEZONE="America/Sao_Paulo"

# Configurações de calendário
railway variables set DEFAULT_APPOINTMENT_DURATION="30"
railway variables set BUFFER_TIME="15"
railway variables set WORKING_HOURS_START="08:00"
railway variables set WORKING_HOURS_END="18:00"
railway variables set WORKING_DAYS="monday,tuesday,wednesday,thursday,friday"
railway variables set MAX_ADVANCE_BOOKING="90"
railway variables set MIN_ADVANCE_BOOKING="1"

# Configurações de sincronização
railway variables set BIDIRECTIONAL_SYNC="true"
railway variables set AUTO_SYNC="true"
railway variables set SYNC_ON_CREATE="true"
railway variables set SYNC_ON_UPDATE="true"
railway variables set SYNC_ON_DELETE="true"
railway variables set CONFLICT_RESOLUTION="local"

# URLs internas dos microserviços (para comunicação entre serviços)
railway variables set AUTH_SERVICE_URL="http://localhost:3001"
railway variables set USER_SERVICE_URL="http://localhost:3002"
railway variables set CLINIC_SERVICE_URL="http://localhost:3003"
railway variables set CONVERSATION_SERVICE_URL="http://localhost:3005"
railway variables set APPOINTMENT_SERVICE_URL="http://localhost:3006"
railway variables set WHATSAPP_SERVICE_URL="http://localhost:3007"
railway variables set GOOGLE_CALENDAR_SERVICE_URL="http://localhost:3008"

echo "Configuração concluída!"
echo "URLs configuradas:"
echo "- Aplicação principal: $RAILWAY_BASE_URL"
echo "- Auth Service: $RAILWAY_BASE_URL:3001"
echo "- User Service: $RAILWAY_BASE_URL:3002"
echo "- Clinic Service: $RAILWAY_BASE_URL:3003"
echo "- Conversation Service: $RAILWAY_BASE_URL:3005"
echo "- Appointment Service: $RAILWAY_BASE_URL:3006"
echo "- WhatsApp Service: $RAILWAY_BASE_URL:3007"
echo "- Google Calendar Service: $RAILWAY_BASE_URL:3008"
