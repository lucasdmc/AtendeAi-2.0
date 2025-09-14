#!/usr/bin/env node

/**
 * =====================================================
 * 🚀 ATENDEAI 2.0 - UNIFIED SERVER FOR RAILWAY
 * =====================================================
 * 
 * Servidor unificado que agrupa todos os microserviços
 * para deploy simplificado no Railway.
 * 
 * Microserviços incluídos:
 * - WhatsApp Service (webhooks + messaging)
 * - Conversation Service (IA + chatbot)  
 * - Clinic Service (configurações)
 * - Health Service (monitoramento)
 * 
 * Todos rodando em um único processo para Railway.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// CONFIGURAÇÃO BÁSICA
// =====================================================

const app = express();
const PORT = process.env.PORT || 8080;

// Inicializar OpenAI de forma lazy (apenas quando necessário)
let openai = null;

async function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    const { default: OpenAI } = await import('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('✅ OpenAI inicializada com sucesso');
  }
  return openai;
}

// CORS simples
app.use(cors());

// Segurança básica
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =====================================================
// WEBHOOK DO WHATSAPP (ROTA PRINCIPAL)
// =====================================================

app.get('/webhook/whatsapp', (req, res) => {
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'atendeai_webhook_verify_2024';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook do WhatsApp verificado com sucesso!');
      res.status(200).send(challenge);
    } else {
      console.log('❌ Token de verificação inválido');
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

app.post('/webhook/whatsapp', async (req, res) => {
  try {
    console.log('📨 Webhook recebido:', JSON.stringify(req.body, null, 2));
    
    // Processar mensagem do WhatsApp
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (messages && messages.length > 0) {
      const message = messages[0];
      const from = message.from;
      const messageText = message.text?.body;
      const messageType = message.type;

      console.log(`📱 Mensagem recebida de ${from}: ${messageText}`);

      // Simular processamento com IA (por enquanto resposta simples)
      const response = await processMessageWithAI(messageText, from);
      
      // Enviar resposta via WhatsApp API
      await sendWhatsAppMessage(from, response);
      
      console.log(`🤖 Resposta enviada: ${response}`);
    }

    res.status(200).send('Processado com sucesso');
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.status(500).send('Erro interno');
  }
});

// =====================================================
// SIMULAÇÃO DA IA (CONVERSATION SERVICE)
// =====================================================

async function processMessageWithAI(message, from) {
  try {
    console.log(`🤖 Processando mensagem com OpenAI: "${message}"`);
    
    const ai = await getOpenAI();
    if (!ai) {
      console.log('⚠️ OpenAI não disponível, usando resposta padrão');
      return getFallbackResponse(message);
    }

    // Context da clínica para a IA
    const clinicContext = `
Você é um assistente virtual da clínica AtendeAI, especializada em atendimento médico de qualidade.

INFORMAÇÕES DA CLÍNICA:
- Nome: Clínica AtendeAI
- Horários: Segunda a Sexta: 8h às 18h | Sábado: 8h às 12h | Domingo: Fechado
- Telefone: (11) 99999-9999
- Endereço: Rua da Clínica, 123
- Especialidades: Clínica Geral, Cardiologia, Ortopedia, Pediatria, Neurologia, Exames laboratoriais

PERSONALIDADE:
- Seja sempre cordial, profissional e empático
- Use emojis de forma moderada para deixar a conversa mais amigável
- Ofereça ajuda proativa
- Sempre tente direcionar para agendamento ou informações úteis

CAPACIDADES:
- Agendar consultas (coleta nome, telefone, especialidade, preferência de data/hora)
- Informar sobre especialidades e serviços
- Fornecer horários de funcionamento
- Dar informações de contato
- Orientar sobre procedimentos

IMPORTANTE: Se for uma emergência médica, oriente a procurar atendimento imediato.
`;

    const completion = await ai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: clinicContext
        },
        {
          role: "user", 
          content: message
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content;
    console.log(`✅ Resposta da OpenAI: ${response}`);
    
    return response;
    
  } catch (error) {
    console.error('❌ Erro na OpenAI:', error);
    console.log('🔄 Usando resposta de fallback...');
    return getFallbackResponse(message);
  }
}

function getFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('bom dia')) {
    return `Olá! 👋 Bem-vindo(a) à Clínica AtendeAI! Como posso ajudá-lo(a) hoje?

Posso ajudar com:
🗓️ Agendamento de consultas
ℹ️ Informações sobre serviços  
📞 Contato com nossa equipe
🕐 Horários de funcionamento

Digite sua dúvida ou escolha uma das opções acima!`;
  }
  
  if (lowerMessage.includes('agendar') || lowerMessage.includes('consulta') || lowerMessage.includes('marcar')) {
    return `📅 Ótimo! Vou te ajudar a agendar sua consulta.

Para prosseguir, preciso de algumas informações:
👤 Seu nome completo
📞 Seu telefone  
🩺 Tipo de consulta desejada
📅 Preferência de data/horário

Você pode me enviar essas informações ou ligar diretamente: (11) 99999-9999`;
  }
  
  if (lowerMessage.includes('horário') || lowerMessage.includes('funcionamento')) {
    return `🕐 Nossos horários de funcionamento:

📅 Segunda a Sexta: 8h às 18h
🕐 Sábado: 8h às 12h  
❌ Domingo: Fechado

📞 Para emergências: (11) 99999-9999`;
  }
  
  if (lowerMessage.includes('serviços') || lowerMessage.includes('especialidades')) {
    return `🏥 Nossos serviços e especialidades:

🩺 Clínica Geral
❤️ Cardiologia  
🦴 Ortopedia
👶 Pediatria
🧠 Neurologia
🔬 Exames laboratoriais

Para agendar, envie uma mensagem ou ligue: (11) 99999-9999`;
  }
  
  return `Obrigado pela sua mensagem! 😊 

Nossa equipe analisará sua solicitação e retornará em breve.

Para atendimento imediato:
📞 Ligue: (11) 99999-9999
📍 Visite-nos: Rua da Clínica, 123

Digite "menu" para ver as opções disponíveis!`;
}

// =====================================================
// ENVIO DE MENSAGENS WHATSAPP
// =====================================================

async function sendWhatsAppMessage(to, message) {
  try {
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    if (!ACCESS_TOKEN || !PHONE_NUMBER_ID) {
      console.log('⚠️ Credenciais do WhatsApp não configuradas, simulando envio...');
      return;
    }

    const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Mensagem enviada com sucesso:', data);
    } else {
      console.error('❌ Erro ao enviar mensagem:', data);
    }
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem WhatsApp:', error);
  }
}

// =====================================================
// ROTAS DA API BÁSICA
// =====================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'AtendeAI 2.0 Unified Server',
    version: '1.2.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Info do sistema
app.get('/api/info', (req, res) => {
  res.json({
    name: 'AtendeAI 2.0',
    version: '1.2.0',
    description: 'Sistema de gestão de clínicas com IA conversacional',
    services: [
      'WhatsApp Integration',
      'Conversation AI',
      'Clinic Management',
      'Health Monitoring'
    ],
    endpoints: {
      webhook: '/webhook/whatsapp',
      health: '/health',
      info: '/api/info'
    }
  });
});

// Menu de opções para teste
app.get('/api/menu', (req, res) => {
  res.json({
    menu: [
      { option: 'agendar', description: 'Agendar consulta' },
      { option: 'horários', description: 'Ver horários de funcionamento' },
      { option: 'serviços', description: 'Ver serviços disponíveis' },
      { option: 'contato', description: 'Informações de contato' }
    ]
  });
});

// Fallback para servir o frontend
app.use(express.static('dist'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// =====================================================
// TRATAMENTO DE ERROS
// =====================================================

app.use((error, req, res, next) => {
  console.error('❌ Erro não tratado:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Entre em contato com o suporte'
  });
});

// =====================================================
// INICIALIZAÇÃO DO SERVIDOR
// =====================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 AtendeAI 2.0 Unified Server iniciado!

📍 Servidor: http://localhost:${PORT}
🌐 Ambiente: ${process.env.NODE_ENV || 'development'}
📱 Webhook WhatsApp: /webhook/whatsapp
🔍 Health Check: /health
📊 Info da API: /api/info

✅ Pronto para receber webhooks do WhatsApp!
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Servidor sendo finalizado...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Servidor sendo finalizado...');
  process.exit(0);
});
