#!/usr/bin/env node

/**
 * SCRIPT DE TESTE DE CONECTIVIDADE SUPABASE - RAILWAY
 * 
 * Este script testa a conectividade com o Supabase usando diferentes
 * configurações para identificar o problema de DNS ENETUNREACH
 */

import { Client } from 'pg';
import { promises as dns } from 'dns';

// Configurações de teste
const configs = {
  // Conexão direta
  direct: {
    host: 'db.kytphnasmdvebmdvvwtx.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'lify2025supa',
    database: 'postgres',
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 5
  },
  
  // Session Pooler do Supabase (recomendado)
  sessionPooler: {
    host: 'aws-1-us-east-2.pooler.supabase.com',
    port: 5432,
    user: 'postgres.kytphnasmdvebmdvvwtx',
    password: 'lify2025supa',
    database: 'postgres',
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 5
  },
  
  // Transaction Pooler do Supabase (alternativa)
  transactionPooler: {
    host: 'aws-1-us-east-2.pooler.supabase.com',
    port: 6543,
    user: 'postgres.kytphnasmdvebmdvvwtx',
    password: 'lify2025supa',
    database: 'postgres',
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 5
  }
};

async function testDNSResolution(hostname) {
  console.log(`🔍 Testando resolução DNS para: ${hostname}`);
  try {
    const addresses = await dns.resolve4(hostname);
    console.log(`✅ DNS resolvido: ${addresses.join(', ')}`);
    return true;
  } catch (error) {
    console.log(`❌ Falha na resolução DNS: ${error.message}`);
    return false;
  }
}

async function testDatabaseConnection(config, name) {
  console.log(`\n🗄️ Testando conexão ${name}...`);
  console.log(`   Host: ${config.host}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   User: ${config.user}`);
  
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log(`✅ Conexão ${name} estabelecida com sucesso!`);
    
    // Testar query simples
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log(`📊 Query de teste executada:`);
    console.log(`   Hora atual: ${result.rows[0].current_time}`);
    console.log(`   Versão PostgreSQL: ${result.rows[0].postgres_version.split(' ')[0]}`);
    
    await client.end();
    return true;
  } catch (error) {
    console.log(`❌ Falha na conexão ${name}:`);
    console.log(`   Erro: ${error.message}`);
    console.log(`   Código: ${error.code}`);
    console.log(`   Detalhes: ${error.detail || 'N/A'}`);
    return false;
  }
}

async function main() {
  console.log('🚀 INICIANDO TESTE DE CONECTIVIDADE SUPABASE - RAILWAY');
  console.log('=' .repeat(60));
  
  // Testar resolução DNS
  console.log('\n1️⃣ TESTE DE RESOLUÇÃO DNS');
  const directDNS = await testDNSResolution(configs.direct.host);
  const sessionPoolerDNS = await testDNSResolution(configs.sessionPooler.host);
  const transactionPoolerDNS = await testDNSResolution(configs.transactionPooler.host);
  
  // Testar conexões de banco
  console.log('\n2️⃣ TESTE DE CONEXÕES DE BANCO');
  const directConnection = await testDatabaseConnection(configs.direct, 'DIRETA');
  const sessionPoolerConnection = await testDatabaseConnection(configs.sessionPooler, 'SESSION POOLER');
  const transactionPoolerConnection = await testDatabaseConnection(configs.transactionPooler, 'TRANSACTION POOLER');
  
  // Resumo dos resultados
  console.log('\n📋 RESUMO DOS TESTES');
  console.log('=' .repeat(60));
  console.log(`DNS Direto: ${directDNS ? '✅' : '❌'}`);
  console.log(`DNS Session Pooler: ${sessionPoolerDNS ? '✅' : '❌'}`);
  console.log(`DNS Transaction Pooler: ${transactionPoolerDNS ? '✅' : '❌'}`);
  console.log(`Conexão Direta: ${directConnection ? '✅' : '❌'}`);
  console.log(`Conexão Session Pooler: ${sessionPoolerConnection ? '✅' : '❌'}`);
  console.log(`Conexão Transaction Pooler: ${transactionPoolerConnection ? '✅' : '❌'}`);
  
  // Recomendações
  console.log('\n💡 RECOMENDAÇÕES');
  if (sessionPoolerConnection) {
    console.log('✅ Use a configuração SESSION POOLER para produção no Railway');
    console.log('   DATABASE_URL=postgresql://postgres.kytphnasmdvebmdvvwtx:lify2025supa@aws-1-us-east-2.pooler.supabase.com:5432/postgres');
  } else if (transactionPoolerConnection) {
    console.log('✅ Use a configuração TRANSACTION POOLER como alternativa');
    console.log('   DATABASE_URL=postgresql://postgres.kytphnasmdvebmdvvwtx:lify2025supa@aws-1-us-east-2.pooler.supabase.com:6543/postgres');
  } else if (directConnection) {
    console.log('⚠️ Use a configuração DIRETA como fallback');
    console.log('   DATABASE_URL=postgresql://postgres:lify2025supa@db.kytphnasmdvebmdvvwtx.supabase.co:5432/postgres');
  } else {
    console.log('❌ Nenhuma conexão funcionou. Verifique:');
    console.log('   1. Credenciais corretas no Supabase');
    console.log('   2. Pooler habilitado no projeto');
    console.log('   3. Restrições de IP no Supabase');
    console.log('   4. Configurações de rede do Railway');
  }
  
  console.log('\n🎯 Para verificar configurações do Supabase:');
  console.log('   1. Acesse: https://kytphnasmdvebmdvvwtx.supabase.co');
  console.log('   2. Settings → Database → Connection Pooling');
  console.log('   3. Verifique se o pooler está ativo');
  console.log('   4. Settings → Database → Network Restrictions');
  console.log('   5. Adicione 0.0.0.0/0 para permitir todas as conexões');
}

// Executar teste
main().catch(console.error);
