#!/usr/bin/env node

// Script para testar conectividade com microserviços do Railway
import https from 'https';
import http from 'http';

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
  return new Promise((resolve) => {
    const url = `${baseUrl}${endpoint}`;
    const client = url.startsWith('https') ? https : http;
    
    console.log(`🔍 Testando ${serviceName} em ${url}...`);
    
    const req = client.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ ${serviceName}: Conectado (${res.statusCode})`);
          try {
            const response = JSON.parse(data);
            console.log(`   📊 Status: ${response.status || 'OK'}`);
            console.log(`   🕒 Timestamp: ${response.timestamp || 'N/A'}`);
          } catch (e) {
            console.log(`   📄 Resposta: ${data.substring(0, 100)}...`);
          }
          resolve({ success: true, status: res.statusCode, data });
        } else {
          console.log(`❌ ${serviceName}: Erro ${res.statusCode}`);
          resolve({ success: false, status: res.statusCode, error: data });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${serviceName}: Erro de conexão - ${error.message}`);
      resolve({ success: false, error: error.message });
    });
    
    req.on('timeout', () => {
      console.log(`⏰ ${serviceName}: Timeout`);
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

async function testAllServices() {
  console.log('🚀 Testando conectividade com microserviços do Railway...\n');
  
  const results = {};
  
  for (const [serviceName, baseUrl] of Object.entries(MICROSERVICES)) {
    const endpoint = ENDPOINTS[serviceName];
    results[serviceName] = await testService(serviceName, baseUrl, endpoint);
    console.log(''); // Linha em branco
  }
  
  console.log('📋 RESUMO DOS TESTES:');
  console.log('====================');
  
  let successCount = 0;
  let totalCount = Object.keys(results).length;
  
  for (const [serviceName, result] of Object.entries(results)) {
    const status = result.success ? '✅' : '❌';
    const statusText = result.success ? 'CONECTADO' : 'FALHOU';
    console.log(`${status} ${serviceName.toUpperCase()}: ${statusText}`);
    
    if (result.success) {
      successCount++;
    } else {
      console.log(`   Erro: ${result.error || result.status}`);
    }
  }
  
  console.log('\n📊 ESTATÍSTICAS:');
  console.log(`✅ Serviços conectados: ${successCount}/${totalCount}`);
  console.log(`❌ Serviços com falha: ${totalCount - successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 TODOS OS MICROSERVIÇOS ESTÃO FUNCIONANDO!');
    console.log('✨ A aplicação está pronta para uso E2E!');
  } else {
    console.log('\n⚠️  ALGUNS SERVIÇOS ESTÃO COM PROBLEMAS');
    console.log('🔧 Verifique as configurações e tente novamente');
  }
  
  return results;
}

// Executar testes
if (import.meta.url === `file://${process.argv[1]}`) {
  testAllServices().catch(console.error);
}

export { testAllServices, testService };
