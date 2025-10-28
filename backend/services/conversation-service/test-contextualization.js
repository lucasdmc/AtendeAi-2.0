#!/usr/bin/env node

/**
 * Script para testar a contextualização JSON ESADI no Conversation Service
 * Este script simula mensagens do WhatsApp para diferentes clínicas
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configurações
const CONVERSATION_SERVICE_URL = process.env.CONVERSATION_SERVICE_URL || 'http://localhost:3005';
const CLINIC_SERVICE_URL = process.env.CLINIC_SERVICE_URL || 'http://localhost:3002';

// IDs de clínicas para teste
const TEST_CLINICS = [
  {
    id: '9981f126-a9b9-4c7d-819a-3380b9ee61de',
    name: 'ESADI',
    expectedAssistant: 'Jessica'
  },
  {
    id: 'test-clinic-123',
    name: 'Clínica Teste',
    expectedAssistant: 'Assistente'
  }
];

// Mensagens de teste
const TEST_MESSAGES = [
  'Olá',
  'Quem é você?',
  'Quais são os horários de funcionamento?',
  'Quais serviços vocês oferecem?',
  'Quero agendar uma consulta'
];

async function testConversation(clinicId, clinicName, expectedAssistant) {
  console.log(`\n🏥 Testando clínica: ${clinicName} (${clinicId})`);
  console.log('='.repeat(60));

  for (const message of TEST_MESSAGES) {
    console.log(`\n📩 Enviando: "${message}"`);
    
    try {
      const response = await fetch(`${CONVERSATION_SERVICE_URL}/api/conversation/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test'
        },
        body: JSON.stringify({
          clinic_id: clinicId,
          patient_phone: '+5511999999999',
          patient_name: 'Paciente Teste',
          message_content: message,
          message_type: 'text'
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log(`✅ Resposta: ${data.response}`);
        
        // Verifica se a resposta está contextualizada
        if (message.toLowerCase().includes('quem') || message.toLowerCase().includes('olá')) {
          const hasCorrectAssistant = data.response.includes(expectedAssistant);
          const hasCorrectClinic = data.response.includes(clinicName);
          
          if (hasCorrectAssistant) {
            console.log(`   ✓ Nome do assistente correto: ${expectedAssistant}`);
          } else {
            console.log(`   ✗ Nome do assistente esperado: ${expectedAssistant}`);
          }
          
          if (hasCorrectClinic || clinicName === 'Clínica Teste') {
            console.log(`   ✓ Nome da clínica correto: ${clinicName}`);
          } else {
            console.log(`   ✗ Nome da clínica esperado: ${clinicName}`);
          }
        }
      } else {
        console.error(`❌ Erro: ${data.error || 'Resposta inválida'}`);
      }
    } catch (error) {
      console.error(`❌ Erro na requisição: ${error.message}`);
    }

    // Pequena pausa entre mensagens
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function checkClinicContext(clinicId) {
  console.log(`\n🔍 Verificando contexto da clínica ${clinicId}...`);
  
  try {
    const response = await fetch(`${CLINIC_SERVICE_URL}/api/clinics/${clinicId}/contextualization`, {
      headers: {
        'Authorization': 'Bearer test'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Contextualização encontrada:`);
      console.log(`   - Tem contextualização: ${!!data.data?.contextualization}`);
      
      if (data.data?.contextualization) {
        const ctx = data.data.contextualization;
        console.log(`   - Nome da clínica: ${ctx.name || ctx.clinica?.informacoes_basicas?.nome || 'N/A'}`);
        console.log(`   - Nome do assistente: ${ctx.ai_personality?.name || ctx.agente_ia?.configuracao?.nome || 'N/A'}`);
        console.log(`   - Especialidades: ${ctx.specialties?.length || ctx.clinica?.informacoes_basicas?.especialidades_secundarias?.length || 0}`);
        console.log(`   - Serviços: ${ctx.services?.length || 0}`);
      }
    } else {
      console.log(`⚠️  Clínica não encontrada ou sem contextualização`);
    }
  } catch (error) {
    console.error(`❌ Erro ao verificar contexto: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Iniciando teste de contextualização JSON ESADI');
  console.log(`📍 Conversation Service: ${CONVERSATION_SERVICE_URL}`);
  console.log(`📍 Clinic Service: ${CLINIC_SERVICE_URL}`);

  // Verifica contexto de cada clínica antes dos testes
  for (const clinic of TEST_CLINICS) {
    await checkClinicContext(clinic.id);
  }

  // Testa conversação com cada clínica
  for (const clinic of TEST_CLINICS) {
    await testConversation(clinic.id, clinic.name, clinic.expectedAssistant);
  }

  console.log('\n✅ Testes concluídos!');
}

// Executa os testes
main().catch(console.error);