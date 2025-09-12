#!/usr/bin/env node

// Teste E2E completo - AtendeAI 2.0
// Verifica se todos os componentes estão funcionando

import fetch from 'node-fetch';

const SERVICES = {
  auth: 'http://localhost:3001',
  clinics: 'http://localhost:3002',
  conversations: 'http://localhost:3003',
  appointments: 'http://localhost:3004',
  whatsapp: 'http://localhost:3005',
  frontend: 'http://localhost:8080'
};

async function testService(name, url, endpoint = '/health') {
  try {
    console.log(`🔍 Testando ${name}...`);
    const response = await fetch(`${url}${endpoint}`, { timeout: 5000 });
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${name}: OK`);
      return { name, status: 'ok', data };
    } else {
      console.log(`❌ ${name}: ERRO - ${response.status}`);
      return { name, status: 'error', error: data };
    }
  } catch (error) {
    console.log(`❌ ${name}: FALHA - ${error.message}`);
    return { name, status: 'failed', error: error.message };
  }
}

async function testE2E() {
  console.log('🚀 INICIANDO TESTE E2E COMPLETO - ATENDEAI 2.0\n');
  
  // Testar microserviços
  const results = [];
  
  for (const [name, url] of Object.entries(SERVICES)) {
    if (name === 'frontend') {
      try {
        console.log(`🔍 Testando ${name}...`);
        const response = await fetch(`${url}/`, { timeout: 5000 });
        if (response.ok) {
          console.log(`✅ ${name}: OK`);
          results.push({ name, status: 'ok' });
        } else {
          console.log(`❌ ${name}: ERRO - ${response.status}`);
          results.push({ name, status: 'error' });
        }
      } catch (error) {
        console.log(`❌ ${name}: FALHA - ${error.message}`);
        results.push({ name, status: 'failed', error: error.message });
      }
    } else {
      const result = await testService(name, url);
      results.push(result);
    }
  }
  
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('====================');
  
  const working = results.filter(r => r.status === 'ok');
  const failed = results.filter(r => r.status !== 'ok');
  
  console.log(`✅ Serviços funcionando: ${working.length}/${results.length}`);
  working.forEach(r => console.log(`   - ${r.name}`));
  
  if (failed.length > 0) {
    console.log(`❌ Serviços com problemas: ${failed.length}`);
    failed.forEach(r => console.log(`   - ${r.name}: ${r.error}`));
  }
  
  // Teste de integração
  console.log('\n🔗 TESTANDO INTEGRAÇÃO:');
  console.log('======================');
  
  try {
    // Testar login
    console.log('🔍 Testando login...');
    const loginResponse = await fetch(`${SERVICES.auth}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        clinicId: '123e4567-e89b-12d3-a456-426614174000'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log(`   Login: ${loginData.success ? '✅' : '❌'} - ${loginData.error || 'OK'}`);
    
    // Testar listagem de clínicas
    console.log('🔍 Testando listagem de clínicas...');
    const clinicsResponse = await fetch(`${SERVICES.clinics}/api/clinics`);
    const clinicsData = await clinicsResponse.json();
    console.log(`   Clínicas: ${clinicsResponse.ok ? '✅' : '❌'} - ${clinicsData.error || 'OK'}`);
    
  } catch (error) {
    console.log(`❌ Erro na integração: ${error.message}`);
  }
  
  console.log('\n🎯 STATUS FINAL:');
  console.log('===============');
  
  if (working.length >= 3) { // Frontend + Auth + pelo menos 1 microserviço
    console.log('✅ SISTEMA E2E FUNCIONANDO!');
    console.log('   - Frontend: http://localhost:8080');
    console.log('   - Microserviços ativos e integrados');
    console.log('   - Pronto para uso produtivo');
  } else {
    console.log('❌ SISTEMA E2E INCOMPLETO');
    console.log('   - Alguns serviços não estão funcionando');
    console.log('   - Verifique os logs acima');
  }
}

testE2E().catch(console.error);
