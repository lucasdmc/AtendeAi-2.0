#!/usr/bin/env node

/**
 * Script para atualizar a contextualização JSON ESADI de uma clínica
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const fs = require('fs').promises;
const path = require('path');

// Configurações
const CLINIC_SERVICE_URL = process.env.CLINIC_SERVICE_URL || 'http://localhost:3002';
const ESADI_CLINIC_ID = '9981f126-a9b9-4c7d-819a-3380b9ee61de';

async function updateClinicContextualization(clinicId, contextualization) {
  try {
    console.log(`📤 Atualizando contextualização para clínica ${clinicId}...`);
    
    const response = await fetch(`${CLINIC_SERVICE_URL}/api/clinics/${clinicId}/contextualization`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test' // Em produção, usar token real
      },
      body: JSON.stringify(contextualization)
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Contextualização atualizada com sucesso!');
      return data.data;
    } else {
      console.error('❌ Erro ao atualizar contextualização:', data.error || data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    return null;
  }
}

async function checkClinic(clinicId) {
  try {
    console.log(`🔍 Verificando se a clínica ${clinicId} existe...`);
    
    const response = await fetch(`${CLINIC_SERVICE_URL}/api/clinics/${clinicId}`, {
      headers: {
        'Authorization': 'Bearer test'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Clínica encontrada: ${data.data.name}`);
      return true;
    } else {
      console.log(`⚠️  Clínica não encontrada`);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar clínica:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Script de atualização de contextualização ESADI');
  console.log(`📍 Clinic Service: ${CLINIC_SERVICE_URL}`);
  console.log(`🏥 Clínica ESADI ID: ${ESADI_CLINIC_ID}`);
  console.log('');

  // Verifica se a clínica existe
  const clinicExists = await checkClinic(ESADI_CLINIC_ID);
  if (!clinicExists) {
    console.log('⚠️  A clínica ESADI não foi encontrada. Certifique-se de que ela foi criada primeiro.');
    process.exit(1);
  }

  // Carrega o JSON de contextualização
  const contextPath = path.join(__dirname, '..', 'examples', 'esadi-context.json');
  console.log(`📄 Carregando contextualização de: ${contextPath}`);
  
  try {
    const contextData = await fs.readFile(contextPath, 'utf8');
    const contextualization = JSON.parse(contextData);
    
    console.log('✅ Contextualização carregada com sucesso');
    console.log(`   - Nome: ${contextualization.clinica.informacoes_basicas.nome}`);
    console.log(`   - Assistente IA: ${contextualization.agente_ia.configuracao.nome}`);
    console.log(`   - Serviços: ${contextualization.servicos.consultas.length + contextualization.servicos.exames.length}`);
    console.log(`   - Profissionais: ${contextualization.profissionais.length}`);
    console.log('');

    // Atualiza a contextualização
    const result = await updateClinicContextualization(ESADI_CLINIC_ID, contextualization);
    
    if (result) {
      console.log('\n✅ Processo concluído com sucesso!');
      console.log('📝 A clínica ESADI agora está configurada com a contextualização JSON.');
    } else {
      console.log('\n❌ Falha ao atualizar a contextualização.');
    }
  } catch (error) {
    console.error('❌ Erro ao carregar ou processar o arquivo de contextualização:', error.message);
    process.exit(1);
  }
}

// Executa o script
main().catch(console.error);