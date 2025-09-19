#!/usr/bin/env node

/**
 * Teste simples do webhook WhatsApp com ESADI
 */

async function testWhatsApp() {
  console.log('🚀 Teste simples de WhatsApp com ESADI\n');
  
  // Verificar servidor
  try {
    const healthResponse = await fetch('http://localhost:8080/health');
    console.log('✅ Servidor rodando na porta 8080');
  } catch (error) {
    console.error('❌ Servidor não encontrado. Execute: node webhook.js');
    return;
  }
  
  // Simular mensagem WhatsApp
  const webhookData = {
    object: 'whatsapp_business_account',
    entry: [{
      id: '123456789',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '554730915628', // Número ESADI
            phone_number_id: '123456789'
          },
          messages: [{
            from: '5547999999999',
            id: 'test_msg_' + Date.now(),
            timestamp: Math.floor(Date.now() / 1000).toString(),
            text: { body: 'Olá, qual o nome da assistente?' },
            type: 'text'
          }]
        },
        field: 'messages'
      }]
    }]
  };
  
  console.log('📨 Enviando mensagem: "Olá, qual o nome da assistente?"');
  console.log('📱 Para número ESADI: 554730915628\n');
  
  try {
    const response = await fetch('http://localhost:8080/webhook/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData)
    });
    
    const result = await response.text();
    console.log('✅ Resposta do servidor:', response.status);
    console.log('📊 Dados:', result);
    console.log('\n✨ Verifique os logs do servidor para ver a resposta gerada!');
    console.log('💡 A resposta deve mencionar "Jessica" e "ESADI"');
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error.message);
  }
}

testWhatsApp();