#!/usr/bin/env node

/**
 * =====================================================
 * 🚀 ATENDEAI 2.0 - WEBHOOK SERVER FOR RAILWAY  
 * =====================================================
 * 
 * Servidor focado EXCLUSIVAMENTE no webhook do WhatsApp
 * Sem dependências conflituosas, máxima compatibilidade
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware básico
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Headers de segurança
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  next();
});

// =====================================================
// WEBHOOK DO WHATSAPP (VERIFICAÇÃO)
// =====================================================
app.get('/webhook/whatsapp', (req, res) => {
  console.log('📞 Webhook GET recebido:', req.query);
  
  const VERIFY_TOKEN = 'atendeai_webhook_verify_2024';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log(`Mode: ${mode}, Token: ${token}, Challenge: ${challenge}`);

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verificado com sucesso!');
      return res.status(200).send(challenge);
    } else {
      console.log('❌ Token inválido');
      return res.status(403).send('Forbidden');
    }
  }
  
  console.log('❌ Parâmetros inválidos');
  return res.status(400).send('Bad Request');
});

// =====================================================
// WEBHOOK DO WHATSAPP (MENSAGENS)
// =====================================================
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    console.log('📨 Webhook POST recebido:', JSON.stringify(req.body, null, 2));
    
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (messages && messages.length > 0) {
      const message = messages[0];
      const from = message.from;
      const messageText = message.text?.body || '[Mídia/Outros]';
      
      console.log(`📱 Nova mensagem de ${from}: ${messageText}`);
      
      // Simular processamento (versão MVP)
      const response = generateSimpleResponse(messageText);
      console.log(`🤖 Resposta gerada: ${response}`);
      
      // Aqui enviaria via WhatsApp API (implementar depois)
      await simulateSendMessage(from, response);
    }

    res.status(200).json({ status: 'ok', processed: true });
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// =====================================================
// GERAÇÃO DE RESPOSTAS SIMPLES
// =====================================================
function generateSimpleResponse(message) {
  const msg = message.toLowerCase();
  
  if (msg.includes('olá') || msg.includes('oi') || msg.includes('bom dia') || msg.includes('boa tarde')) {
    return `Olá! 👋 Bem-vindo(a) à Clínica AtendeAI!

Como posso ajudá-lo(a) hoje?

🗓️ Agendar consulta
ℹ️ Informações sobre serviços  
📞 Falar com atendente
🕐 Horários de funcionamento

Digite sua dúvida!`;
  }
  
  if (msg.includes('agendar') || msg.includes('consulta') || msg.includes('marcar')) {
    return `📅 Ótimo! Vou te ajudar a agendar sua consulta.

Para prosseguir, preciso de:
👤 Seu nome completo
📞 Seu telefone  
🩺 Especialidade desejada
📅 Preferência de data/horário

Ou ligue diretamente: (47) 3091-5628`;
  }
  
  if (msg.includes('horário') || msg.includes('funcionamento')) {
    return `🕐 Nossos horários de funcionamento:

📅 Segunda a Sexta: 8h às 18h
🕐 Sábado: 8h às 12h  
❌ Domingo: Fechado

📞 Contato: (47) 3091-5628`;
  }
  
  if (msg.includes('serviços') || msg.includes('especialidades')) {
    return `🏥 Nossas especialidades:

🩺 Clínica Geral
❤️ Cardiologia  
🦴 Ortopedia
👶 Pediatria
🧠 Neurologia
🔬 Exames laboratoriais

📞 Agende: (47) 3091-5628`;
  }
  
  return `Obrigado pela sua mensagem! 😊

Nossa equipe analisará e retornará em breve.

Para atendimento imediato:
📞 Ligue: (47) 3091-5628
📍 Visite nossa clínica

Digite "menu" para ver opções!`;
}

// =====================================================
// SIMULAÇÃO DE ENVIO (IMPLEMENTAR WhatsApp API DEPOIS)
// =====================================================
async function simulateSendMessage(to, message) {
  console.log(`📤 Simulando envio para ${to}: ${message.substring(0, 50)}...`);
  
  // TODO: Implementar WhatsApp Business API
  // const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  // const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  return { success: true, messageId: 'simulated-' + Date.now() };
}

// =====================================================
// ROTAS DE HEALTH E INFO
// =====================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'AtendeAI 2.0 Webhook Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'AtendeAI 2.0',
    description: 'Webhook server para integração WhatsApp',
    endpoints: {
      webhook_verify: 'GET /webhook/whatsapp',
      webhook_receive: 'POST /webhook/whatsapp',
      health: 'GET /health'
    },
    whatsapp_number: '554730915628'
  });
});

// =====================================================
// SERVIR FRONTEND ESTÁTICO
// =====================================================
app.use(express.static(join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// =====================================================
// TRATAMENTO DE ERROS
// =====================================================
app.use((error, req, res, next) => {
  console.error('❌ Erro:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
  });
});

// =====================================================
// INICIALIZAÇÃO
// =====================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 AtendeAI 2.0 Webhook Server

📍 URL: http://localhost:${PORT}
🌐 Ambiente: ${process.env.NODE_ENV || 'development'}
📱 Webhook: /webhook/whatsapp
🔍 Health: /health

✅ Pronto para receber webhooks do Meta WhatsApp!
📞 Número WhatsApp: 554730915628
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Servidor finalizando...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Servidor finalizando...');
  process.exit(0);
});
