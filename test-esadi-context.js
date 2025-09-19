#!/usr/bin/env node

/**
 * Script de teste para verificar conversação contextualizada com ESADI
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Contexto completo da ESADI para testes
const esadiContext = {
  "clinic_info": {
    "name": "ESADI",
    "type": "Centro de Especialidades",
    "specialty": "Gastroenterologia e Endoscopia Digestiva",
    "description": "Centro especializado em saúde do aparelho digestivo com tecnologia de ponta para Santa Catarina. Oferecemos exames de baixa, média e alta complexidade em ambiente diferenciado.",
    "mission": "Proporcionar diagnósticos precisos e tratamentos eficazes para patologias do aparelho digestivo com tecnologia avançada e atendimento humanizado.",
    "values": [
      "Excelência em diagnóstico",
      "Tecnologia de ponta",
      "Atendimento humanizado",
      "Segurança do paciente",
      "Ética profissional"
    ],
    "differentials": [
      "Comunicação direta com Hospital Santa Isabel",
      "Espaço diferenciado para acolhimento",
      "Fluxo otimizado de pacientes",
      "Equipamentos de última geração",
      "Equipe de anestesiologia especializada"
    ]
  },
  "ai_personality": {
    "name": "Jessica",
    "tone": "professional",
    "formality": "medium",
    "languages": ["português"],
    "greeting": "Olá! Sou a Jessica, assistente virtual da ESADI. Estou aqui para ajudá-lo com agendamentos e orientações sobre exames. Como posso ajudá-lo hoje?",
    "farewell": "Obrigado por escolher a ESADI para cuidar da sua saúde digestiva. Até breve!",
    "out_of_hours": "No momento estamos fora do horário de atendimento. Para urgências gastroenterológicas, procure o pronto-socorro do Hospital Santa Isabel. Retornaremos seu contato no próximo horário comercial."
  },
  "ai_behavior": {
    "proactivity": "medium",
    "suggestions": true,
    "feedback": true,
    "auto_escalation": true,
    "escalation_threshold": 3,
    "memory_enabled": true,
    "context_window": 10
  },
  "working_hours": {
    "segunda": {"abertura": "07:00", "fechamento": "18:00"},
    "terca": {"abertura": "07:00", "fechamento": "18:00"},
    "quarta": {"abertura": "07:00", "fechamento": "18:00"},
    "quinta": {"abertura": "07:00", "fechamento": "18:00"},
    "sexta": {"abertura": "07:00", "fechamento": "17:00"},
    "sabado": {"abertura": "07:00", "fechamento": "12:00"},
    "domingo": {"abertura": null, "fechamento": null}
  },
  "services": [
    {
      "id": "exam_001",
      "name": "Endoscopia Digestiva Alta",
      "category": "Endoscopia",
      "duration": 30,
      "price": 450.00
    },
    {
      "id": "exam_002",
      "name": "Colonoscopia",
      "category": "Endoscopia",
      "duration": 45,
      "price": 650.00
    },
    {
      "id": "exam_003",
      "name": "Teste Respiratório para H. Pylori",
      "category": "Teste Diagnóstico",
      "duration": 60,
      "price": 180.00
    }
  ],
  "professionals": [
    {
      "id": "prof_001",
      "name": "Dr. Carlos Eduardo Silva",
      "specialties": ["Gastroenterologia", "Endoscopia Digestiva"],
      "accepts_new_patients": true
    },
    {
      "id": "prof_002",
      "name": "Dr. João da Silva",
      "specialties": ["Endoscopia Digestiva", "Colonoscopia"],
      "accepts_new_patients": true
    }
  ],
  "appointment_policies": {
    "min_advance_notice": 24,
    "max_advance_days": 90,
    "allow_rescheduling": true,
    "cancellation_notice": 24,
    "confirmation_required": true
  }
};

// Função para gerar resposta contextualizada
function generateContextualizedResponse(message, context) {
  const messageLower = message.toLowerCase();
  const clinicInfo = context.clinic_info;
  const aiPersonality = context.ai_personality;
  
  console.log('📨 Mensagem recebida:', message);
  
  // Saudação inicial
  if (messageLower.includes('oi') || messageLower.includes('olá') || messageLower.includes('bom dia') || 
      messageLower.includes('boa tarde') || messageLower.includes('boa noite')) {
    return aiPersonality.greeting;
  }
  
  // Pergunta sobre nome
  if (messageLower.includes('qual') && messageLower.includes('nome')) {
    return `Meu nome é ${aiPersonality.name}! Sou a assistente virtual da ${clinicInfo.name}. Como posso ajudá-lo? 😊`;
  }
  
  // Informações sobre a clínica
  if (messageLower.includes('clínica') || messageLower.includes('esadi') || messageLower.includes('sobre')) {
    let response = `Sobre a ${clinicInfo.name}:\n\n`;
    response += `${clinicInfo.description}\n\n`;
    response += `*Especialidade:* ${clinicInfo.specialty}\n\n`;
    response += `*Diferenciais:*\n`;
    clinicInfo.differentials.forEach(diff => {
      response += `• ${diff}\n`;
    });
    response += `\nPosso ajudá-lo com agendamentos ou informações sobre nossos exames! 😊`;
    return response;
  }
  
  // Horários de funcionamento
  if (messageLower.includes('horário') || messageLower.includes('funcionamento') || messageLower.includes('aberto')) {
    let response = `*Horários de funcionamento da ${clinicInfo.name}:*\n\n`;
    Object.entries(context.working_hours).forEach(([day, hours]) => {
      const dayName = {
        'segunda': 'Segunda-feira',
        'terca': 'Terça-feira',
        'quarta': 'Quarta-feira',
        'quinta': 'Quinta-feira',
        'sexta': 'Sexta-feira',
        'sabado': 'Sábado',
        'domingo': 'Domingo'
      }[day];
      
      if (hours.abertura && hours.fechamento) {
        response += `• ${dayName}: ${hours.abertura} às ${hours.fechamento}\n`;
      } else {
        response += `• ${dayName}: Fechado\n`;
      }
    });
    return response;
  }
  
  // Exames disponíveis
  if (messageLower.includes('exame') || messageLower.includes('serviço') || messageLower.includes('procedimento')) {
    let response = `*Exames disponíveis na ${clinicInfo.name}:*\n\n`;
    context.services.forEach(service => {
      response += `• *${service.name}*\n`;
      response += `  Categoria: ${service.category}\n`;
      response += `  Duração: ${service.duration} minutos\n`;
      response += `  Valor particular: R$ ${service.price.toFixed(2)}\n\n`;
    });
    response += `Posso ajudá-lo a agendar algum desses exames! 😊`;
    return response;
  }
  
  // Médicos
  if (messageLower.includes('médico') || messageLower.includes('doutor') || messageLower.includes('profissional')) {
    let response = `*Nossos especialistas:*\n\n`;
    context.professionals.forEach(prof => {
      response += `• *${prof.name}*\n`;
      response += `  Especialidades: ${prof.specialties.join(', ')}\n\n`;
    });
    return response;
  }
  
  // Agendamento
  if (messageLower.includes('agendar') || messageLower.includes('marcar') || messageLower.includes('consulta')) {
    return `Para agendar um exame na ${clinicInfo.name}, preciso de algumas informações:\n\n• Seu nome completo\n• Telefone de contato\n• Qual exame deseja realizar\n• Convênio (se houver)\n\nPode me informar esses dados? 😊`;
  }
  
  // Preparo de exames
  if (messageLower.includes('preparo') || messageLower.includes('jejum') || messageLower.includes('preparação')) {
    let response = `*Preparação para exames na ${clinicInfo.name}:*\n\n`;
    response += `*Endoscopia Digestiva Alta:*\n• Jejum absoluto de 12 horas\n• Medicamentos podem ser tomados com pouca água até 2h antes\n\n`;
    response += `*Colonoscopia:*\n• Dieta específica 3 dias antes\n• Uso de laxante conforme orientação\n• Jejum absoluto de 12 horas\n\n`;
    response += `*Teste H. Pylori:*\n• Suspender antibióticos por 4 semanas\n• Suspender omeprazol por 2 semanas\n• Jejum de 6 horas\n\n`;
    response += `Precisa de mais detalhes sobre algum exame específico? 😊`;
    return response;
  }
  
  // Despedida
  if (messageLower.includes('tchau') || messageLower.includes('até') || messageLower.includes('obrigado')) {
    return aiPersonality.farewell;
  }
  
  // Resposta padrão
  return `Olá! Sou a ${aiPersonality.name} da ${clinicInfo.name}. Como posso ajudá-lo hoje? Posso fornecer informações sobre:\n\n• Nossos exames e procedimentos\n• Horários de funcionamento\n• Preparação para exames\n• Agendamentos\n• Nossos especialistas\n\nO que gostaria de saber? 😊`;
}

// Testes simulados
console.log('🚀 Iniciando testes de conversação contextualizada com ESADI\n');
console.log('=' .repeat(60));

const testMessages = [
  "Olá!",
  "Qual seu nome?",
  "Me fale sobre a ESADI",
  "Quais exames vocês fazem?",
  "Qual o horário de funcionamento?",
  "Como é o preparo para endoscopia?",
  "Quero marcar um exame",
  "Quais médicos atendem aí?",
  "Obrigado!"
];

testMessages.forEach((message, index) => {
  console.log(`\n📱 Teste ${index + 1}:`);
  console.log(`👤 Usuário: ${message}`);
  const response = generateContextualizedResponse(message, esadiContext);
  console.log(`🤖 Jessica (ESADI): ${response}`);
  console.log('-'.repeat(60));
});

// Servidor HTTP para testes via webhook
const PORT = 3333;
const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.method === 'POST' && req.url === '/test-conversation') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { message } = JSON.parse(body);
        const response = generateContextualizedResponse(message, esadiContext);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          response: response,
          context: 'ESADI',
          assistant: 'Jessica'
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }
  
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'OK',
      service: 'ESADI Context Test Server',
      context: 'ESADI configured',
      assistant: 'Jessica'
    }));
    return;
  }
  
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`
\n🌐 Servidor de teste iniciado!
📍 URL: http://localhost:${PORT}
🔍 Health Check: GET /health
💬 Testar conversação: POST /test-conversation
   Body: { "message": "sua mensagem aqui" }
  `);
});

process.on('SIGINT', () => {
  console.log('\n👋 Encerrando servidor de teste...');
  server.close(() => process.exit(0));
});