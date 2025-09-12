#!/usr/bin/env node

// Script simples para testar conectividade com microserviços
import fetch from 'node-fetch';

const MICROSERVICES = {
  auth: 'https://atendeai-2-0-production.up.railway.app:3001',
  clinics: 'https://atendeai-2-0-production.up.railway.app:3003',
  conversations: 'https://atendeai-2-0-production.up.railway.app:3005',
  appointments: 'https://atendeai-2-0-production.up.railway.app:3006',
  whatsapp: 'https://atendeai-2-0-production.up.railway.app:3007'
};

const ENDPOINTS = {
  auth: '/api/v1/auth/health',
  clinics: '/health',
  conversations: '/api/conversation/health',
  appointments: '/api/appointment/health',
  whatsapp: '/health'
};

async function testService(serviceName, baseUrl, endpoint) {
  try {
    console.log(`🔍 Testando ${serviceName}...`);
    const url = `${baseUrl}${endpoint}`;
    
    const response = await fetch(url, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'AtendeAI-Test-Client'
      }
    });
    
    if (response.ok) {
      const data = await response.text();
      console.log(`✅ ${serviceName}: Conectado (${response.status})`);
      try {
        const json = JSON.parse(data);
        console.log(`   📊 Status: ${json.status || 'OK'}`);
      } catch (e) {
        console.log(`   📄 Resposta: ${data.substring(0, 100)}...`);
      }
      return { success: true, status: response.status };
    } else {
      console.log(`❌ ${serviceName}: Erro ${response.status}`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.log(`❌ ${serviceName}: Erro de conexão - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAllServices() {
  console.log('🚀 Testando conectividade com microserviços do Railway...\n');
  
  const results = {};
  
  for (const [serviceName, baseUrl] of Object.entries(MICROSERVICES)) {
    const endpoint = ENDPOINTS[serviceName];
    results[serviceName] = await testService(serviceName, baseUrl, endpoint);
    console.log('');
  }
  
  console.log('📋 RESUMO DOS TESTES:');
  console.log('====================');
  
  let successCount = 0;
  const totalCount = Object.keys(results).length;
  
  for (const [serviceName, result] of Object.entries(results)) {
    const status = result.success ? '✅' : '❌';
    const statusText = result.success ? 'CONECTADO' : 'FALHOU';
    console.log(`${status} ${serviceName.toUpperCase()}: ${statusText}`);
    
    if (result.success) {
      successCount++;
    }
  }
  
  console.log(`\n📊 Serviços conectados: ${successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 TODOS OS MICROSERVIÇOS ESTÃO FUNCIONANDO!');
  } else {
    console.log('\n⚠️  ALGUNS SERVIÇOS ESTÃO COM PROBLEMAS');
  }
  
  return results;
}

testAllServices().catch(console.error);
