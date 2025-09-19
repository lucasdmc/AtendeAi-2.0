#!/usr/bin/env node

/**
 * Teste do Webhook WhatsApp com contexto ESADI
 * Simula conversação completa com a clínica ESADI
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const webhookUrl = 'http://localhost:8080/webhook/whatsapp';
const esadiPhoneNumber = '554730915628'; // Número da ESADI

// Simular diferentes mensagens para testar contexto
const testMessages = [
  {
    text: "Olá!",
    description: "Saudação inicial"
  },
  {
    text: "Qual seu nome?",
    description: "Pergunta sobre identidade do assistente"
  },
  {
    text: "Quais exames a ESADI realiza?",
    description: "Informações sobre serviços"
  },
  {
    text: "Como é o preparo para endoscopia?",
    description: "Preparo de exames"
  },
  {
    text: "Qual o horário de funcionamento?",
    description: "Horários da clínica"
  },
  {
    text: "Quero marcar uma endoscopia",
    description: "Intenção de agendamento"
  }
];

async function sendWhatsAppMessage(messageText, fromNumber = '5547999999999') {
  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '123456789',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: esadiPhoneNumber,
                phone_number_id: '123456789'
              },
              messages: [
                {
                  from: fromNumber,
                  id: `wamid.test_${Date.now()}`,
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  text: {
                    body: messageText
                  },
                  type: 'text'
                }
              ]
            },
            field: 'messages'
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.text();
    return { status: response.status, result };
  } catch (error) {
    return { error: error.message };
  }
}

async function testESADIConversation() {
  console.log('🚀 Iniciando teste de conversação WhatsApp com ESADI');
  console.log('📱 Número da ESADI:', esadiPhoneNumber);
  console.log('=' .repeat(60));
  console.log('');

  // Primeiro, verificar se o servidor está rodando
  try {
    const healthCheck = await fetch('http://localhost:8080/health', { timeout: 5000 });
    const healthData = await healthCheck.text();
    if (!healthCheck.ok) {
      console.error('❌ Servidor não está respondendo. Execute primeiro: node webhook.js');
      return;
    }
    console.log('✅ Servidor está rodando');
    console.log('📊 Health:', healthData.substring(0, 100) + '...');
    console.log('');
  } catch (error) {
    console.error('❌ Erro ao conectar com servidor:', error.message);
    console.error('❌ Execute primeiro: node webhook.js');
    return;
  }

  // Executar testes sequencialmente
  for (const testMessage of testMessages) {
    console.log(`📨 Teste: ${testMessage.description}`);
    console.log(`👤 Usuário: "${testMessage.text}"`);
    
    const response = await sendWhatsAppMessage(testMessage.text);
    
    if (response.error) {
      console.log(`❌ Erro: ${response.error}`);
    } else {
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Resposta do servidor: ${response.result}`);
    }
    
    console.log('-'.repeat(60));
    console.log('');
    
    // Aguardar um pouco entre mensagens
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('🎉 Teste concluído!');
  console.log('');
  console.log('💡 Dicas:');
  console.log('- Verifique os logs do servidor para ver as respostas geradas');
  console.log('- As respostas devem mencionar ESADI e Jessica (assistente)');
  console.log('- O contexto da clínica deve estar sendo usado nas respostas');
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Teste de Conversação WhatsApp com ESADI

Uso:
  node test-esadi-whatsapp.js           Executa teste completo
  node test-esadi-whatsapp.js --single  Envia apenas uma mensagem
  node test-esadi-whatsapp.js --help    Mostra esta ajuda

Pré-requisitos:
  1. Servidor rodando: node webhook.js
  2. Contexto ESADI configurado no banco de dados
  `);
  process.exit(0);
}

if (args.includes('--single')) {
  // Modo de mensagem única
  const message = args[args.indexOf('--single') + 1] || "Olá, quais exames vocês fazem?";
  console.log('📨 Enviando mensagem única:', message);
  sendWhatsAppMessage(message).then(response => {
    console.log('Resposta:', response);
  });
} else {
  // Executar teste completo
  testESADIConversation();
}