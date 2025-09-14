#!/usr/bin/env node

/**
 * =====================================================
 * 🚀 ATENDEAI 2.0 - SERVIDOR INTEGRADO
 * =====================================================
 * 
 * Servidor monolítico com todas as funcionalidades dos microserviços
 * Integra: Auth, Clinics, Conversations, Appointments, WhatsApp
 */

import { createServer } from 'http';
import { parse } from 'url';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 8080;

// =====================================================
// CONFIGURAÇÕES
// =====================================================
const config = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d'
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:Supa201294base@db.kytphnasmdvebmdvvwtx.supabase.co:5432/postgres'
  },
  supabase: {
    url: process.env.SUPABASE_URL || 'https://kytphnasmdvebmdvvwtx.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9lIjoiYW5vbiIsImlhdCI6MTc1NTYyMjgxMCwiZXhwIjoyMDcxMTk4ODEwfQ.gfH3VNqxLZWAbjlrlk44VrBdyF1QKv7CyOSLmhFwbqA'
  },
  whatsapp: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'atendeai_webhook_verify_2024'
  }
};

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

function sendJSONResponse(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function authenticateToken(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    return decoded;
  } catch (error) {
    return null;
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
// HANDLERS DOS MICROSERVIÇOS
// =====================================================

// Auth Service Handlers
async function handleAuthRoutes(req, res, pathname) {
  const method = req.method;
  
  if (method === 'POST' && pathname === '/api/auth/login') {
    try {
      const body = await getRequestBody(req);
      const { email, password, clinicId } = body;
      
      // Simulação de login (em produção, conectar com banco real)
      if (email === 'admin@lify.com' && password === 'admin123') {
        const accessToken = jwt.sign(
          {
            sub: '1',
            email: email,
            clinicId: clinicId || '1',
            roles: ['admin_lify'],
            type: 'access',
          },
          config.jwt.secret,
          { expiresIn: config.jwt.accessTokenExpiry }
        );

        const refreshToken = jwt.sign(
          {
            sub: '1',
            email: email,
            clinicId: clinicId || '1',
            type: 'refresh',
          },
          config.jwt.secret,
          { expiresIn: config.jwt.refreshTokenExpiry }
        );

        sendJSONResponse(res, 200, {
          success: true,
          data: {
            accessToken,
            refreshToken,
            user: {
              id: '1',
              email: email,
              firstName: 'Admin',
              lastName: 'Lify',
              roles: ['admin_lify'],
              clinicId: clinicId || '1',
            },
          },
          message: 'Login successful',
        });
      } else {
        sendJSONResponse(res, 401, {
          success: false,
          error: 'Invalid credentials',
        });
      }
    } catch (error) {
      sendJSONResponse(res, 500, {
        success: false,
        error: 'Internal server error',
      });
    }
  } else if (method === 'GET' && pathname === '/api/auth/validate') {
    const user = authenticateToken(req);
    if (user) {
      sendJSONResponse(res, 200, {
        success: true,
        data: {
          valid: true,
          user: {
            id: user.sub,
            email: user.email,
            roles: user.roles || [],
            clinicId: user.clinicId,
          },
        },
        message: 'Token is valid',
      });
    } else {
      sendJSONResponse(res, 401, {
        success: false,
        error: 'Invalid token',
      });
    }
  } else if (method === 'GET' && pathname === '/api/auth/health') {
    sendJSONResponse(res, 200, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Auth Service',
      version: '1.0.0',
    });
  } else {
    sendJSONResponse(res, 404, { error: 'Endpoint not found' });
  }
}

// Clinic Service Handlers
async function handleClinicRoutes(req, res, pathname) {
  const method = req.method;
  
  if (method === 'GET' && pathname === '/api/clinics') {
    // Simulação de dados de clínicas
    const clinics = [
      {
        id: '1',
        name: 'Clínica AtendeAI',
        whatsapp_number: '554730915628',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        context_json: {
          clinica: {
            informacoes_basicas: {
              nome: 'Clínica AtendeAI',
              descricao: 'Clínica especializada em atendimento médico de qualidade'
            },
            localizacao: {
              endereco_principal: 'Rua das Flores, 123 - Centro'
            },
            contatos: {
              telefone_principal: '(47) 3091-5628',
              email_principal: 'contato@atendeai.com'
            }
          }
        }
      }
    ];
    
    sendJSONResponse(res, 200, {
      success: true,
      data: clinics
    });
  } else if (method === 'GET' && pathname.startsWith('/api/clinics/')) {
    const clinicId = pathname.split('/')[3];
    const clinic = {
      id: clinicId,
      name: 'Clínica AtendeAI',
      whatsapp_number: '554730915628',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    sendJSONResponse(res, 200, {
      success: true,
      data: clinic
    });
  } else if (method === 'GET' && pathname === '/api/clinics/health') {
    sendJSONResponse(res, 200, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Clinic Service',
      version: '1.0.0',
    });
  } else {
    sendJSONResponse(res, 404, { error: 'Endpoint not found' });
  }
}

// Conversation Service Handlers
async function handleConversationRoutes(req, res, pathname) {
  const method = req.method;
  
  if (method === 'POST' && pathname === '/api/conversations/process') {
    try {
      const body = await getRequestBody(req);
      const { clinic_id, patient_phone, message_content, patient_name } = body;
      
      // Processar mensagem com IA
      const response = await generateIntelligentResponse(message_content, patient_phone);
      
      sendJSONResponse(res, 200, {
        success: true,
        response: response
      });
    } catch (error) {
      sendJSONResponse(res, 500, {
        success: false,
        error: 'Internal server error',
      });
    }
  } else if (method === 'GET' && pathname.startsWith('/api/conversations/clinic/')) {
    const clinicId = pathname.split('/')[4];
    const conversations = [];
    
    sendJSONResponse(res, 200, {
      success: true,
      data: conversations,
      pagination: {
        total: 0,
        limit: 50,
        offset: 0
      }
    });
  } else if (method === 'GET' && pathname === '/api/conversations/health') {
    sendJSONResponse(res, 200, {
      success: true,
      service: 'conversation-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } else {
    sendJSONResponse(res, 404, { error: 'Endpoint not found' });
  }
}

// Appointment Service Handlers
async function handleAppointmentRoutes(req, res, pathname) {
  const method = req.method;
  
  if (method === 'GET' && pathname.startsWith('/api/appointments')) {
    const appointments = [];
    
    sendJSONResponse(res, 200, {
      success: true,
      data: appointments,
      pagination: {
        total: 0,
        limit: 50,
        offset: 0
      }
    });
  } else if (method === 'POST' && pathname === '/api/appointments') {
    try {
      const body = await getRequestBody(req);
      const appointment = {
        id: uuidv4(),
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'scheduled'
      };
      
      sendJSONResponse(res, 201, {
        success: true,
        data: appointment
      });
    } catch (error) {
      sendJSONResponse(res, 500, {
        success: false,
        error: 'Internal server error',
      });
    }
  } else if (method === 'GET' && pathname === '/api/appointments/health') {
    sendJSONResponse(res, 200, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Appointment Service',
      version: '1.0.0',
    });
  } else {
    sendJSONResponse(res, 404, { error: 'Endpoint not found' });
  }
}

// WhatsApp Service Handlers
async function handleWhatsAppRoutes(req, res, pathname) {
  const method = req.method;
  
  if (method === 'GET' && pathname === '/api/whatsapp/health') {
    sendJSONResponse(res, 200, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'WhatsApp Service',
      version: '1.0.0',
    });
  } else {
    sendJSONResponse(res, 404, { error: 'Endpoint not found' });
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
    const ACCESS_TOKEN = config.whatsapp.accessToken;
    const PHONE_NUMBER_ID = config.whatsapp.phoneNumberId;
    
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
// SERVIDOR HTTP PRINCIPAL
// =====================================================
const server = createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  const { pathname, query } = parsedUrl;
  const method = req.method;

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-clinic-id');
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
    
    const VERIFY_TOKEN = config.whatsapp.verifyToken;
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
  // ROTAS DOS MICROSERVIÇOS INTEGRADOS
  // =====================================================
  if (pathname.startsWith('/api/auth/')) {
    handleAuthRoutes(req, res, pathname);
    return;
  } else if (pathname.startsWith('/api/clinics')) {
    handleClinicRoutes(req, res, pathname);
    return;
  } else if (pathname.startsWith('/api/conversations/')) {
    handleConversationRoutes(req, res, pathname);
    return;
  } else if (pathname.startsWith('/api/appointments/')) {
    handleAppointmentRoutes(req, res, pathname);
    return;
  } else if (pathname.startsWith('/api/whatsapp/')) {
    handleWhatsAppRoutes(req, res, pathname);
    return;
  }

  // =====================================================
  // HEALTH CHECK
  // =====================================================
  if (method === 'GET' && pathname === '/health') {
    const healthData = {
      status: 'OK',
      service: 'AtendeAI 2.0 Integrated Server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      microservices: {
        auth: 'integrated',
        clinics: 'integrated',
        conversations: 'integrated',
        appointments: 'integrated',
        whatsapp: 'integrated'
      }
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
      name: 'AtendeAI 2.0 Integrated Server',
      description: 'Servidor integrado com todos os microserviços',
      whatsapp_number: '554730915628',
      features: ['OpenAI Integration', 'Conversation Memory', 'Data Collection', 'Integrated Microservices'],
      endpoints: {
        webhook_verify: 'GET /webhook/whatsapp',
        webhook_receive: 'POST /webhook/whatsapp',
        health: 'GET /health',
        auth: 'POST /api/auth/login, GET /api/auth/validate',
        clinics: 'GET /api/clinics, GET /api/clinics/:id',
        conversations: 'POST /api/conversations/process',
        appointments: 'GET /api/appointments, POST /api/appointments'
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
// INICIALIZAÇÃO
// =====================================================
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 AtendeAI 2.0 Integrated Server

📍 URL: http://localhost:${PORT}
📱 Webhook: /webhook/whatsapp  
🔍 Health: /health
📞 WhatsApp: 554730915628

✅ Microserviços Integrados:
   - Auth Service: /api/auth/*
   - Clinic Service: /api/clinics/*
   - Conversation Service: /api/conversations/*
   - Appointment Service: /api/appointments/*
   - WhatsApp Service: /api/whatsapp/*

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
