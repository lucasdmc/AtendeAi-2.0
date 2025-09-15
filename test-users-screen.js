#!/usr/bin/env node

// Teste para verificar se a tela de usuários está funcionando
console.log('🧪 Testando correção da tela de usuários...\n');

async function testUsersAPI() {
  try {
    console.log('1. Testando API de usuários...');
    
    const response = await fetch('https://atendeai-20-production.up.railway.app/api/users', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ API de usuários funcionando!');
    console.log(`📊 Total de usuários encontrados: ${data.data.length}`);
    console.log(`🔍 Fonte dos dados: ${data.source}`);
    
    if (data.data.length > 0) {
      console.log('\n👥 Usuários encontrados:');
      data.data.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.login}) - ${user.role} - ${user.status}`);
      });
    }
    
    console.log('\n✅ Teste da API concluído com sucesso!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao testar API de usuários:', error.message);
    return false;
  }
}

async function testFrontendConnection() {
  try {
    console.log('\n2. Testando conexão com frontend...');
    
    const response = await fetch('http://localhost:8080', {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log('✅ Frontend está rodando na porta 8080');
    console.log('🌐 Acesse: http://localhost:8080/users');
    console.log('💡 A tela de usuários deve estar funcionando agora!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao conectar com frontend:', error.message);
    console.log('💡 Certifique-se de que o servidor de desenvolvimento está rodando: npm run dev -- --port 8080');
    return false;
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes de correção da tela de usuários...\n');
  
  const apiTest = await testUsersAPI();
  const frontendTest = await testFrontendConnection();
  
  console.log('\n📋 Resumo dos testes:');
  console.log(`   API de usuários: ${apiTest ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`   Frontend: ${frontendTest ? '✅ PASSOU' : '❌ FALHOU'}`);
  
  if (apiTest && frontendTest) {
    console.log('\n🎉 Todos os testes passaram! A tela de usuários deve estar funcionando.');
    console.log('\n📝 O que foi corrigido:');
    console.log('   - Endpoints de usuários agora apontam para o servidor principal integrado');
    console.log('   - Removida dependência do microserviço de usuários não implementado');
    console.log('   - Adicionada função helper para obter clinic_id do localStorage');
    console.log('   - Todos os métodos do userApi (getUsers, getUser, createUser, updateUser, deleteUser) corrigidos');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique os erros acima.');
  }
}

// Executar testes
runTests().catch(console.error);
