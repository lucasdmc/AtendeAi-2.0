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
          
          // Gerar resposta inteligente com OpenAI + memória + coleta de dados
          const response = await generateIntelligentResponse(messageText, from);
          console.log(`🤖 Resposta: ${response.substring(0, 100)}...`);
          
          // Mostrar dados coletados no log
          const conversation = getConversation(from);
          if (Object.keys(conversation.userData).length > 0) {
            console.log(`📊 Dados coletados:`, conversation.userData);
          }
          
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
      description: 'Webhook server WhatsApp com IA',
      whatsapp_number: '554730915628',
      features: ['OpenAI Integration', 'Conversation Memory', 'Data Collection'],
      endpoints: {
        webhook_verify: 'GET /webhook/whatsapp',
        webhook_receive: 'POST /webhook/whatsapp',
        health: 'GET /health',
        conversations: 'GET /api/conversations'
      }
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(info, null, 2));
    return;
  }

  // =====================================================
  // CONVERSAÇÕES ATIVAS (MONITORAMENTO)
  // =====================================================
  if (method === 'GET' && pathname === '/api/conversations') {
    const stats = {
      total_conversations: conversations.size,
      active_conversations: [],
      timestamp: new Date().toISOString()
    };
    
    // Adicionar dados das conversações (sem dados pessoais sensíveis)
    for (const [phoneNumber, conversation] of conversations.entries()) {
      const maskedPhone = phoneNumber.substring(0, 6) + '***' + phoneNumber.substring(-2);
      stats.active_conversations.push({
        phone: maskedPhone,
        messages_count: conversation.messages.length,
        has_user_data: Object.keys(conversation.userData).length > 0,
        last_activity: new Date(conversation.lastActivity).toISOString(),
        context: conversation.context
      });
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats, null, 2));
    return;
  }

  // =====================================================
  // PROXY PARA MICROSERVIÇOS
  // =====================================================
  if (pathname.startsWith('/api/')) {
    // Extrair o serviço e endpoint da URL
    const pathParts = pathname.split('/');
    const service = pathParts[2]; // auth, clinics, conversations, etc.
    const endpoint = '/' + pathParts.slice(3).join('/');
    
    // Mapear serviços para suas URLs internas
    const serviceUrls = {
      'auth': process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      'users': process.env.USER_SERVICE_URL || 'http://localhost:3002',
      'clinics': process.env.CLINIC_SERVICE_URL || 'http://localhost:3003',
      'conversations': process.env.CONVERSATION_SERVICE_URL || 'http://localhost:3005',
      'appointments': process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3006',
      'whatsapp': process.env.WHATSAPP_SERVICE_URL || 'http://localhost:3007',
      'google-calendar': process.env.GOOGLE_CALENDAR_SERVICE_URL || 'http://localhost:3008'
    };
    
    const serviceUrl = serviceUrls[service];
    if (!serviceUrl) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Service not found' }));
      return;
    }
    
    // Fazer proxy da requisição para o microserviço de forma assíncrona
    handleProxyRequest(req, res, serviceUrl, endpoint, method);
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
// UTILITÁRIOS
// =====================================================
async function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

async function handleProxyRequest(req, res, serviceUrl, endpoint, method) {
  try {
    const targetUrl = `${serviceUrl}${endpoint}`;
    console.log(`🔄 Proxying ${method} ${req.url} to ${targetUrl}`);
    
    // Processar o body se necessário
    let requestBody = null;
    if (method !== 'GET') {
      requestBody = await getRequestBody(req);
    }
    
    const proxyReq = await fetch(targetUrl, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
        'x-clinic-id': req.headers['x-clinic-id'] || '',
        ...req.headers
      },
      body: requestBody ? JSON.stringify(requestBody) : undefined
    });
    
    const responseData = await proxyReq.text();
    const contentType = proxyReq.headers.get('content-type') || 'application/json';
    
    res.writeHead(proxyReq.status, { 'Content-Type': contentType });
    res.end(responseData);
    
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
}

// =====================================================
// MEMÓRIA DE CONVERSAÇÃO (SIMPLES - EM MEMÓRIA)
// =====================================================
const conversations = new Map(); // phoneNumber -> conversationData

function getConversation(phoneNumber) {
  if (!conversations.has(phoneNumber)) {
    conversations.set(phoneNumber, {
      messages: [],
      userData: {},
      context: 'initial',
      lastActivity: Date.now()
    });
  }
  return conversations.get(phoneNumber);
}

function addMessageToHistory(phoneNumber, message, sender = 'user') {
  const conversation = getConversation(phoneNumber);
  conversation.messages.push({
    text: message,
    sender: sender,
    timestamp: Date.now()
  });
  conversation.lastActivity = Date.now();
  
  // Manter apenas últimas 10 mensagens para performance
  if (conversation.messages.length > 10) {
    conversation.messages = conversation.messages.slice(-10);
  }
}

// =====================================================
// INTEGRAÇÃO OPENAI + GERAÇÃO INTELIGENTE
// =====================================================
async function generateIntelligentResponse(message, phoneNumber) {
  const conversation = getConversation(phoneNumber);
  
  // Adicionar mensagem do usuário ao histórico
  addMessageToHistory(phoneNumber, message, 'user');
  
  // Tentar OpenAI primeiro, fallback para regras simples
  const openAIResponse = await tryOpenAIResponse(message, conversation);
  if (openAIResponse) {
    addMessageToHistory(phoneNumber, openAIResponse, 'assistant');
    return openAIResponse;
  }
  
  // Fallback: Lógica baseada em regras + coleta de dados
  const ruleResponse = generateRuleBasedResponse(message, conversation);
  addMessageToHistory(phoneNumber, ruleResponse, 'assistant');
  return ruleResponse;
}

async function tryOpenAIResponse(message, conversation) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      console.log('⚠️ OpenAI API Key não configurada, usando regras');
      return null;
    }

    // Construir contexto da conversa
    const conversationHistory = conversation.messages
      .slice(-6) // Últimas 6 mensagens
      .map(msg => `${msg.sender}: ${msg.text}`)
      .join('\n');

    const userData = conversation.userData;
    const userContext = Object.keys(userData).length > 0 
      ? `\nDados do usuário coletados: ${JSON.stringify(userData)}`
      : '\nNenhum dado do usuário coletado ainda.';

    const systemPrompt = `Você é um assistente virtual da Clínica AtendeAI, especializada em atendimento médico de qualidade.

INFORMAÇÕES DA CLÍNICA:
- Nome: Clínica AtendeAI
- Telefone: (47) 3091-5628
- Horários: Segunda a Sexta 8h-18h, Sábado 8h-12h, Domingo fechado
- Especialidades: Clínica Geral, Cardiologia, Ortopedia, Pediatria, Neurologia, Exames

PERSONALIDADE:
- Seja cordial, profissional e empático
- Use emojis moderadamente 
- Faça perguntas para coletar dados necessários
- Sempre tente ajudar e direcionar para soluções

COLETA DE DADOS:
Para agendamentos, colete: nome completo, telefone, especialidade desejada, preferência de data/horário.

IMPORTANTE:
- Mantenha respostas concisas (máximo 200 caracteres)
- Se emergência médica, oriente procurar atendimento imediato
- Sempre ofereça o telefone (47) 3091-5628 para contato direto

Histórico da conversa:
${conversationHistory}${userContext}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      console.log('❌ OpenAI API erro:', response.status);
      return null;
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('✅ Resposta OpenAI gerada:', aiResponse.substring(0, 100) + '...');
    
    // Tentar extrair dados da mensagem do usuário
    extractUserData(message, conversation);
    
    return aiResponse;
    
  } catch (error) {
    console.error('❌ Erro OpenAI:', error.message);
    return null;
  }
}

// =====================================================
// EXTRAÇÃO E COLETA DE DADOS
// =====================================================
function extractUserData(message, conversation) {
  const msg = message.toLowerCase();
  const userData = conversation.userData;
  
  // Extrair nome (padrões simples)
  const namePatterns = [
    /meu nome é (.+)/,
    /me chamo (.+)/,
    /sou (.+)/,
    /^([a-záêç\s]+)$/
  ];
  
  for (const pattern of namePatterns) {
    const match = msg.match(pattern);
    if (match && match[1] && match[1].length > 2 && match[1].length < 50) {
      const possibleName = match[1].trim();
      // Verificar se não é uma palavra comum
      if (!['sim', 'não', 'ok', 'obrigado', 'oi', 'olá'].includes(possibleName)) {
        userData.name = possibleName;
        console.log(`📝 Nome coletado: ${possibleName}`);
        break;
      }
    }
  }
  
  // Extrair telefone
  const phonePattern = /(\d{10,11}|\(\d{2}\)\s*\d{4,5}-?\d{4})/;
  const phoneMatch = message.match(phonePattern);
  if (phoneMatch) {
    userData.phone = phoneMatch[1];
    console.log(`📞 Telefone coletado: ${phoneMatch[1]}`);
  }
  
  // Detectar especialidade mencionada
  const specialties = {
    'cardiologia': 'Cardiologia',
    'coração': 'Cardiologia', 
    'ortopedia': 'Ortopedia',
    'osso': 'Ortopedia',
    'pediatria': 'Pediatria',
    'criança': 'Pediatria',
    'neurologia': 'Neurologia',
    'cabeça': 'Neurologia',
    'geral': 'Clínica Geral',
    'clínico geral': 'Clínica Geral'
  };
  
  for (const [keyword, specialty] of Object.entries(specialties)) {
    if (msg.includes(keyword)) {
      userData.specialty = specialty;
      console.log(`🩺 Especialidade detectada: ${specialty}`);
      break;
    }
  }
}

// =====================================================
// GERAÇÃO DE RESPOSTAS BASEADA EM REGRAS (FALLBACK)
// =====================================================
function generateRuleBasedResponse(message, conversation) {
  const msg = message.toLowerCase();
  const userData = conversation.userData;
  
  // Saudações
  if (msg.includes('olá') || msg.includes('oi') || msg.includes('bom dia')) {
    return `Olá! 👋 Sou o assistente virtual da Clínica AtendeAI.

Como posso ajudá-lo hoje?
🗓️ Agendar consulta
ℹ️ Informações sobre serviços
📞 Falar com atendente`;
  }
  
  // Agendamento
  if (msg.includes('agendar') || msg.includes('consulta') || msg.includes('marcar')) {
    if (!userData.name) {
      return `📅 Ótimo! Vou te ajudar a agendar.

Primeiro, qual é seu nome completo?`;
    } else if (!userData.phone) {
      return `Olá ${userData.name}! 

Qual seu telefone para contato?`;
    } else if (!userData.specialty) {
      return `Perfeito ${userData.name}!

Qual especialidade você precisa?
🩺 Clínica Geral
❤️ Cardiologia  
🦴 Ortopedia
👶 Pediatria
🧠 Neurologia`;
    } else {
      return `Excelente! Tenho seus dados:
👤 ${userData.name}
📞 ${userData.phone}
🩺 ${userData.specialty}

Nossa equipe entrará em contato em breve para confirmar horário disponível!

Ou ligue: (47) 3091-5628`;
    }
  }
  
  // Horários
  if (msg.includes('horário') || msg.includes('funcionamento')) {
    return `🕐 Horários de funcionamento:

📅 Segunda a Sexta: 8h às 18h
🕐 Sábado: 8h às 12h  
❌ Domingo: Fechado

📞 (47) 3091-5628`;
  }
  
  // Serviços
  if (msg.includes('serviços') || msg.includes('especialidades')) {
    return `🏥 Nossas especialidades:

🩺 Clínica Geral
❤️ Cardiologia  
🦴 Ortopedia
👶 Pediatria
🧠 Neurologia
🔬 Exames laboratoriais

📞 (47) 3091-5628`;
  }
  
  // Resposta padrão
  return `Obrigado pela mensagem! 😊

Para melhor atendimento:
📞 Ligue: (47) 3091-5628
📝 Ou diga "agendar" para marcar consulta

Como posso ajudar?`;
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
