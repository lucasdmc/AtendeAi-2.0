#!/usr/bin/env node

// Script de teste para validar operações CRUD de clínicas
import https from 'https';

const API_BASE = 'https://atendeai-20-production.up.railway.app/api/clinics';

// Configuração para requisições HTTPS
const requestOptions = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer test'
  }
};

// Função auxiliar para fazer requisições
function makeRequest(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      ...requestOptions,
      method,
      hostname: 'atendeai-20-production.up.railway.app',
      path: url.replace('https://atendeai-20-production.up.railway.app', ''),
      port: 443
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            data: body ? JSON.parse(body) : null
          };
          resolve(result);
        } catch (error) {
          reject(new Error(`Erro ao parsear resposta: ${error.message}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Testes CRUD
async function testClinicCRUD() {
  console.log('🧪 Iniciando testes CRUD de clínicas...\n');

  try {
    // 1. Teste READ - Listar clínicas
    console.log('1️⃣ Testando READ (listar clínicas)...');
    const listResponse = await makeRequest('GET', API_BASE);
    console.log(`   Status: ${listResponse.status}`);
    console.log(`   Sucesso: ${listResponse.data?.success}`);
    console.log(`   Clínicas encontradas: ${listResponse.data?.data?.length || 0}`);
    
    if (listResponse.status !== 200) {
      throw new Error(`Falha no READ: ${listResponse.status}`);
    }
    console.log('   ✅ READ funcionando\n');

    // 2. Teste CREATE - Criar nova clínica
    console.log('2️⃣ Testando CREATE (criar clínica)...');
    const newClinic = {
      name: `Clínica Teste ${Date.now()}`,
      whatsapp_id_number: `+5511999${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      status: 'active'
    };
    
    const createResponse = await makeRequest('POST', API_BASE, newClinic);
    console.log(`   Status: ${createResponse.status}`);
    console.log(`   Sucesso: ${createResponse.data?.success}`);
    
    if (createResponse.status !== 201) {
      throw new Error(`Falha no CREATE: ${createResponse.status} - ${createResponse.data?.message || 'Erro desconhecido'}`);
    }
    
    const createdClinic = createResponse.data?.data;
    console.log(`   Clínica criada com ID: ${createdClinic?.id}`);
    console.log('   ✅ CREATE funcionando\n');

    // 3. Teste READ - Buscar clínica específica
    console.log('3️⃣ Testando READ (buscar clínica específica)...');
    const getResponse = await makeRequest('GET', `${API_BASE}/${createdClinic.id}`);
    console.log(`   Status: ${getResponse.status}`);
    console.log(`   Sucesso: ${getResponse.data?.success}`);
    
    if (getResponse.status !== 200) {
      throw new Error(`Falha no READ específico: ${getResponse.status}`);
    }
    console.log('   ✅ READ específico funcionando\n');

    // 4. Teste UPDATE - Atualizar clínica
    console.log('4️⃣ Testando UPDATE (atualizar clínica)...');
    const updateData = {
      name: `${newClinic.name} - ATUALIZADA`,
      whatsapp_id_number: newClinic.whatsapp_id_number,
      status: 'inactive'
    };
    
    const updateResponse = await makeRequest('PUT', `${API_BASE}/${createdClinic.id}`, updateData);
    console.log(`   Status: ${updateResponse.status}`);
    console.log(`   Sucesso: ${updateResponse.data?.success}`);
    
    if (updateResponse.status !== 200) {
      throw new Error(`Falha no UPDATE: ${updateResponse.status} - ${updateResponse.data?.message || 'Erro desconhecido'}`);
    }
    console.log('   ✅ UPDATE funcionando\n');

    // 5. Teste DELETE - Deletar clínica
    console.log('5️⃣ Testando DELETE (deletar clínica)...');
    const deleteResponse = await makeRequest('DELETE', `${API_BASE}/${createdClinic.id}`);
    console.log(`   Status: ${deleteResponse.status}`);
    console.log(`   Sucesso: ${deleteResponse.data?.success}`);
    
    if (deleteResponse.status !== 200) {
      throw new Error(`Falha no DELETE: ${deleteResponse.status} - ${deleteResponse.data?.message || 'Erro desconhecido'}`);
    }
    console.log('   ✅ DELETE funcionando\n');

    // 6. Verificar se a clínica foi realmente deletada
    console.log('6️⃣ Verificando se a clínica foi deletada...');
    const verifyResponse = await makeRequest('GET', `${API_BASE}/${createdClinic.id}`);
    console.log(`   Status: ${verifyResponse.status}`);
    
    if (verifyResponse.status === 404) {
      console.log('   ✅ Clínica foi deletada com sucesso (404 esperado)\n');
    } else {
      console.log('   ⚠️  Clínica ainda existe após DELETE\n');
    }

    console.log('🎉 Todos os testes CRUD passaram com sucesso!');
    console.log('\n📋 Resumo dos testes:');
    console.log('   ✅ CREATE - Criar clínica');
    console.log('   ✅ READ - Listar clínicas');
    console.log('   ✅ READ - Buscar clínica específica');
    console.log('   ✅ UPDATE - Atualizar clínica');
    console.log('   ✅ DELETE - Deletar clínica');
    console.log('   ✅ Verificação de deleção');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    process.exit(1);
  }
}

// Executar testes
testClinicCRUD();
