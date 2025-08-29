#!/usr/bin/env node

/**
 * =====================================================
 * 🚀 ATENDEAI 2.0 - PURE NODE.JS WEBHOOK SERVER
 * =====================================================
 * 
 * Servidor HTTP puro sem dependências externas
 * ZERO conflitos, máxima compatibilidade
 */

import { createServer } from 'http';
import { parse } from 'url';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 8080;

// =====================================================
// SERVIDOR HTTP PURO
// =====================================================
const server = createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  const { pathname, query } = parsedUrl;
  const method = req.method;

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  console.log(`${method} ${pathname}`);

  // OPTIONS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // =====================================================
  // WEBHOOK GET (VERIFICAÇÃO)
  // =====================================================
  if (method === 'GET' && pathname === '/webhook/whatsapp') {
    console.log('📞 Webhook verification:', query);
    
    const VERIFY_TOKEN = 'atendeai_webhook_verify_2024';
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
      console.log('✅ Webhook verified successfully!');
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(challenge);
    } else {
      console.log('❌ Invalid verification parameters');
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
    }
    return;
  }

  // =====================================================
  // WEBHOOK POST (MENSAGENS)
  // =====================================================
  if (method === 'POST' && pathname === '/webhook/whatsapp') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        console.log('📨 Webhook message received:', body);
        
        const data = JSON.parse(body);
        const entry = data.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (messages && messages.length > 0) {
          const message = messages[0];
          const from = message.from;
          const messageText = message.text?.body || '[Mídia]';
          
          console.log(`📱 Nova mensagem de ${from}: ${messageText}`);
          
          const response = generateResponse(messageText);
          console.log(`🤖 Resposta: ${response.substring(0, 100)}...`);
          
          // Enviar resposta via WhatsApp API
          await sendWhatsAppMessage(from, response);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } catch (error) {
        console.error('❌ Erro processing webhook:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal error' }));
      }
    });
    return;
  }

  // =====================================================
  // HEALTH CHECK
  // =====================================================
  if (method === 'GET' && pathname === '/health') {
    const healthData = {
      status: 'OK',
      service: 'AtendeAI 2.0 Webhook',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(healthData, null, 2));
    return;
  }

  // =====================================================
  // API INFO
  // =====================================================
  if (method === 'GET' && pathname === '/api/info') {
    const info = {
      name: 'AtendeAI 2.0',
      description: 'Webhook server WhatsApp',
      whatsapp_number: '554730915628',
      endpoints: {
        webhook_verify: 'GET /webhook/whatsapp',
        webhook_receive: 'POST /webhook/whatsapp',
        health: 'GET /health'
      }
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(info, null, 2));
    return;
  }

  // =====================================================
  // FRONTEND ESTÁTICO
  // =====================================================
  if (method === 'GET') {
    try {
      let filePath = pathname === '/' ? '/index.html' : pathname;
      const fullPath = join(__dirname, 'dist', filePath);
      
      const content = readFileSync(fullPath);
      const ext = filePath.split('.').pop();
      
      const mimeTypes = {
        'html': 'text/html',
        'js': 'application/javascript',
        'css': 'text/css',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon'
      };
      
      const contentType = mimeTypes[ext] || 'text/plain';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (error) {
      // Fallback para SPA
      try {
        const indexPath = join(__dirname, 'dist', 'index.html');
        const content = readFileSync(indexPath);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      } catch (fallbackError) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    }
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// =====================================================
// GERAÇÃO DE RESPOSTAS
// =====================================================
function generateResponse(message) {
  const msg = message.toLowerCase();
  
  if (msg.includes('olá') || msg.includes('oi') || msg.includes('bom dia')) {
    return `Olá! 👋 Bem-vindo(a) à Clínica AtendeAI!

Como posso ajudá-lo(a) hoje?

🗓️ Agendar consulta
ℹ️ Informações sobre serviços  
📞 Falar com atendente
🕐 Horários de funcionamento

Digite sua dúvida!`;
  }
  
  if (msg.includes('agendar') || msg.includes('consulta')) {
    return `📅 Ótimo! Vou te ajudar a agendar sua consulta.

Para prosseguir, preciso de:
👤 Seu nome completo
📞 Seu telefone  
🩺 Especialidade desejada
📅 Preferência de data/horário

Ou ligue: (47) 3091-5628`;
  }
  
  if (msg.includes('horário') || msg.includes('funcionamento')) {
    return `🕐 Nossos horários:

📅 Segunda a Sexta: 8h às 18h
🕐 Sábado: 8h às 12h  
❌ Domingo: Fechado

📞 Contato: (47) 3091-5628`;
  }
  
  return `Obrigado pela sua mensagem! 😊

Nossa equipe analisará e retornará em breve.

Para atendimento imediato:
📞 Ligue: (47) 3091-5628

Digite "menu" para ver opções!`;
}

// =====================================================
// ENVIO VIA WHATSAPP BUSINESS API
// =====================================================
async function sendWhatsAppMessage(to, message) {
  try {
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      console.log('⚠️ Credenciais WhatsApp não configuradas, simulando envio...');
      console.log('📤 Resposta simulada enviada com sucesso');
      return { success: false, error: 'Missing credentials' };
    }

    const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: message
      }
    };

    console.log(`📤 Enviando mensagem para ${to}...`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.text();
    
    if (response.ok) {
      console.log('✅ Mensagem enviada com sucesso via WhatsApp API!');
      console.log('📊 Response:', data);
      return { success: true, data: JSON.parse(data) };
    } else {
      console.error('❌ Erro ao enviar mensagem:', response.status, data);
      console.log('📤 Fallback: Resposta simulada');
      return { success: false, error: data };
    }
    
  } catch (error) {
    console.error('❌ Erro na WhatsApp API:', error.message);
    console.log('📤 Fallback: Resposta simulada');
    return { success: false, error: error.message };
  }
}

// =====================================================
// INICIALIZAÇÃO
// =====================================================
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 AtendeAI 2.0 Webhook Server (Pure Node.js)

📍 URL: http://localhost:${PORT}
📱 Webhook: /webhook/whatsapp  
🔍 Health: /health
📞 WhatsApp: 554730915628

✅ Pronto para receber webhooks do Meta!
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Servidor finalizando...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('🛑 Servidor finalizando...');
  server.close(() => process.exit(0));
});
