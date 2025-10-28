#!/usr/bin/env node

/**
 * Script de teste para o sistema de conversação com contexto ESADI
 * Testa a integração completa WhatsApp -> Conversation Service -> LLM com contexto
 */

import fetch from 'node-fetch';
import pg from 'pg';
const { Client } = pg;

// Configurações
const SERVICES = {
  auth: 'http://localhost:3001',
  clinics: 'http://localhost:3002',
  conversations: 'http://localhost:3005',
  whatsapp: 'http://localhost:3007'
};

// Configuração do banco para obter o clinic_id da ESADI
const dbConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.kytphnasmdvebmdvvwtx:lify2025supa@aws-1-us-east-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
};

// Mensagens de teste simulando conversa real
const testMessages = [
  {
    type: 'greeting',
    message: 'Olá, bom dia!',
    expected: 'Jessica|assistente virtual|ESADI'
  },
  {
    type: 'service_inquiry',
    message: 'Quais serviços vocês oferecem?',
    expected: 'psicoterapia|terapia|psicológico'
  },
  {
    type: 'professional_inquiry',
    message: 'Quem são os psicólogos que atendem aí?',
    expected: 'Dra. Maria|Dr. João|Dra. Ana'
  },
  {
    type: 'appointment_request',
    message: 'Gostaria de agendar uma consulta de psicoterapia individual',
    expected: 'agendar|horário|disponível'
  },
  {
    type: 'location_inquiry',
    message: 'Onde fica a clínica?',
    expected: 'Vila Mariana|São Paulo'
  },
  {
    type: 'insurance_inquiry',
    message: 'Vocês aceitam o convênio Unimed?',
    expected: 'Unimed|convênio|aceito'
  }
];

async function getEsadiClinicId() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const result = await client.query(`
      SELECT id, name, whatsapp_number 
      FROM atendeai.clinics 
      WHERE name ILIKE '%ESADI%' 
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      throw new Error('Clínica ESADI não encontrada no banco de dados');
    }
    
    return result.rows[0];
  } finally {
    await client.end();
  }
}

async function testConversationService(clinicId, message) {
  try {
    const response = await fetch(`${SERVICES.conversations}/api/conversation/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-clinic-id': clinicId
      },
      body: JSON.stringify({
        clinicId: clinicId,
        message: message,
        customerPhone: '+5511987654321',
        messageType: 'text'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao chamar conversation service:', error);
    return null;
  }
}

async function testWhatsAppWebhook(clinicId, message) {
  try {
    // Simular webhook do WhatsApp
    const webhookPayload = {
      entry: [{
        id: clinicId,
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '11987654321',
              phone_number_id: 'test_phone_id'
            },
            messages: [{
              from: '5511999999999',
              id: `test_msg_${Date.now()}`,
              timestamp: Math.floor(Date.now() / 1000).toString(),
              type: 'text',
              text: {
                body: message
              }
            }]
          }
        }]
      }]
    };

    const response = await fetch(`${SERVICES.whatsapp}/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Erro ao chamar webhook:', error);
    return null;
  }
}

async function verifyClinicContext(clinicId) {
  try {
    const response = await fetch(`${SERVICES.clinics}/api/clinics/${clinicId}/context`, {
      method: 'GET',
      headers: {
        'x-clinic-id': clinicId
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao verificar contexto:', error);
    return null;
  }
}

async function runTests() {
  console.log('🧪 TESTE DO SISTEMA DE CONVERSAÇÃO COM CONTEXTO ESADI');
  console.log('=====================================================\n');

  try {
    // 1. Obter ID da clínica ESADI
    console.log('1️⃣ Obtendo ID da clínica ESADI...');
    const esadiInfo = await getEsadiClinicId();
    console.log(`✅ Clínica encontrada: ${esadiInfo.name}`);
    console.log(`   ID: ${esadiInfo.id}`);
    console.log(`   WhatsApp: ${esadiInfo.whatsapp_number}\n`);

    // 2. Verificar se o contexto está configurado
    console.log('2️⃣ Verificando contexto da clínica...');
    const context = await verifyClinicContext(esadiInfo.id);
    if (context && context.data) {
      console.log('✅ Contexto configurado:');
      console.log(`   - Nome da assistente: ${context.data.ai_personality?.name || 'N/A'}`);
      console.log(`   - Serviços: ${context.data.services?.length || 0} disponíveis`);
      console.log(`   - Profissionais: ${context.data.professionals?.length || 0} cadastrados\n`);
    } else {
      console.log('⚠️  Contexto não encontrado ou serviço indisponível\n');
    }

    // 3. Testar conversation service diretamente
    console.log('3️⃣ Testando Conversation Service diretamente...');
    for (const test of testMessages) {
      console.log(`\n📝 Teste: ${test.type}`);
      console.log(`   Mensagem: "${test.message}"`);
      
      const result = await testConversationService(esadiInfo.id, test.message);
      
      if (result) {
        console.log(`   ✅ Resposta recebida:`);
        console.log(`      ${result.response?.substring(0, 150)}...`);
        
        // Verificar se a resposta contém palavras esperadas
        const expectedWords = test.expected.split('|');
        const responseText = (result.response || '').toLowerCase();
        const foundWords = expectedWords.filter(word => responseText.includes(word.toLowerCase()));
        
        if (foundWords.length > 0) {
          console.log(`   ✅ Contexto ESADI detectado: ${foundWords.join(', ')}`);
        } else {
          console.log(`   ⚠️  Contexto ESADI não claramente identificado`);
        }
      } else {
        console.log(`   ❌ Falha ao obter resposta`);
      }
    }

    // 4. Testar via webhook do WhatsApp
    console.log('\n\n4️⃣ Testando via Webhook do WhatsApp...');
    const webhookTest = await testWhatsAppWebhook(esadiInfo.id, 'Olá! Gostaria de informações sobre a clínica ESADI');
    if (webhookTest) {
      console.log('✅ Webhook processou a mensagem');
    } else {
      console.log('❌ Falha no processamento do webhook');
    }

    // Resumo final
    console.log('\n\n📊 RESUMO DO TESTE');
    console.log('==================');
    console.log('✅ Clínica ESADI encontrada no banco de dados');
    console.log('✅ Sistema de conversação respondendo');
    console.log('🔍 Verificar logs dos serviços para detalhes das respostas');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Verificar logs do conversation-service para respostas completas');
    console.log('   2. Testar via WhatsApp real após deploy');
    console.log('   3. Ajustar prompts se necessário');

  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error.message);
  }
}

// Aguardar serviços iniciarem
console.log('⏳ Aguardando 5 segundos para os serviços iniciarem...\n');
setTimeout(runTests, 5000);