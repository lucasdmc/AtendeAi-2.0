#!/usr/bin/env node

/**
 * Teste direto do contexto ESADI
 */

// Importar as funções do webhook
import { readFileSync } from 'fs';

// Contexto mockado da ESADI para teste
const mockESADIContext = {
  "clinic_info": {
    "name": "ESADI",
    "type": "Centro de Especialidades",
    "specialty": "Gastroenterologia e Endoscopia Digestiva",
    "description": "Centro especializado em saúde do aparelho digestivo com tecnologia de ponta"
  },
  "ai_personality": {
    "name": "Jessica",
    "tone": "professional",
    "greeting": "Olá! Sou a Jessica, assistente virtual da ESADI. Como posso ajudá-lo?"
  },
  "working_hours": {
    "segunda": {"abertura": "07:00", "fechamento": "18:00"},
    "terca": {"abertura": "07:00", "fechamento": "18:00"}
  },
  "services": [
    {
      "id": "exam_001",
      "name": "Endoscopia Digestiva Alta",
      "category": "Endoscopia",
      "duration": 30,
      "price": 450.00
    }
  ]
};

// Função simplificada de resposta
function generateResponse(message, context) {
  const messageLower = message.toLowerCase();
  const clinicInfo = context.clinic_info;
  const aiPersonality = context.ai_personality;
  
  if (messageLower.includes('nome')) {
    return `Meu nome é ${aiPersonality.name}! Sou a assistente virtual da ${clinicInfo.name}. 😊`;
  }
  
  if (messageLower.includes('exame')) {
    let response = `*Exames disponíveis na ${clinicInfo.name}:*\n\n`;
    context.services.forEach(service => {
      response += `• *${service.name}*\n`;
      response += `  Valor: R$ ${service.price}\n`;
    });
    return response;
  }
  
  return aiPersonality.greeting;
}

console.log('🧪 Teste direto do contexto ESADI\n');

const testMessages = [
  "Olá!",
  "Qual seu nome?",
  "Quais exames vocês fazem?"
];

testMessages.forEach(msg => {
  console.log(`👤 Usuário: ${msg}`);
  const response = generateResponse(msg, mockESADIContext);
  console.log(`🤖 Jessica: ${response}`);
  console.log('-'.repeat(50));
});

// Testar se o webhook está acessível
console.log('\n📡 Testando conexão com webhook...');
fetch('http://localhost:8080/api/info')
  .then(res => res.json())
  .then(data => {
    console.log('✅ Webhook acessível!');
    console.log('📊 Info:', JSON.stringify(data, null, 2));
  })
  .catch(err => {
    console.log('❌ Webhook não acessível:', err.message);
  });