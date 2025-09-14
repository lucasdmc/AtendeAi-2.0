#!/usr/bin/env node

/**
 * Teste do Webhook WhatsApp - AtendeAI 2.0
 * Simula uma mensagem do WhatsApp para testar a integração
 */

const testWebhook = async () => {
  const webhookUrl = 'http://localhost:8080/webhook/whatsapp';
  
  // Simular mensagem do WhatsApp
  const testMessage = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '123456789',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '554730915628',
                phone_number_id: '123456789'
              },
              messages: [
                {
                  from: '5547999999999',
                  id: 'wamid.test123',
                  timestamp: '1640995200',
                  text: {
                    body: 'Olá! Gostaria de agendar uma consulta'
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

  console.log('🧪 Testando webhook do WhatsApp...');
  console.log('📱 Simulando mensagem de: 5547999999999');
  console.log('💬 Conteúdo: "Olá! Gostaria de agendar uma consulta"');
  console.log('');

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    });

    const result = await response.text();
    
    console.log('✅ Status:', response.status);
    console.log('📊 Response:', result);
    
    if (response.ok) {
      console.log('');
      console.log('🎉 Webhook funcionando perfeitamente!');
      console.log('🤖 A IA deve ter processado a mensagem e gerado uma resposta');
    } else {
      console.log('❌ Erro no webhook');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error.message);
  }
};

// Executar teste
testWebhook();
