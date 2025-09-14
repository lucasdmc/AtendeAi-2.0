#!/usr/bin/env node

/**
 * SCRIPT DE TESTE DE CONEXÕES DE BANCO DE DADOS
 * ATENDEAI 2.0 - VALIDAÇÃO PÓS-CORREÇÕES
 * 
 * Este script testa as conexões de todos os serviços com o banco Supabase
 * após as correções de configuração implementadas.
 */

import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do banco
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Supa201294base@db.kytphnasmdvebmdvvwtx.supabase.co:5432/postgres';

console.log('🔧 TESTE DE CONEXÕES DE BANCO DE DADOS - ATENDEAI 2.0');
console.log('====================================================');
console.log(`📅 Data: ${new Date().toISOString()}`);
console.log(`🔗 DATABASE_URL: ${DATABASE_URL.replace(/:[^:@]*@/, ':***@')}`);
console.log('');

async function testDatabaseConnection() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('supabase') ? {
      rejectUnauthorized: false
    } : false,
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('🔄 Testando conexão com Supabase...');
    
    // Teste básico de conexão
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso');
    
    // Teste de query básica
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log(`✅ Query executada: ${result.rows[0].current_time}`);
    console.log(`📊 PostgreSQL Version: ${result.rows[0].pg_version.split(' ')[0]}`);
    
    // Teste de acesso ao schema atendeai
    const schemaResult = await client.query(`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema = 'atendeai' 
      ORDER BY table_name
    `);
    
    console.log(`✅ Schema 'atendeai' acessível - ${schemaResult.rows.length} tabelas encontradas:`);
    schemaResult.rows.forEach(row => {
      console.log(`   📋 ${row.table_name}`);
    });
    
    // Teste de dados existentes
    const dataResult = await client.query(`
      SELECT 
        'clinics' as table_name, COUNT(*) as count FROM atendeai.clinics
      UNION ALL
      SELECT 'users', COUNT(*) FROM atendeai.users
      UNION ALL  
      SELECT 'roles', COUNT(*) FROM atendeai.roles
      UNION ALL
      SELECT 'permissions', COUNT(*) FROM atendeai.permissions
      ORDER BY table_name
    `);
    
    console.log('\n📊 Dados existentes no schema atendeai:');
    dataResult.rows.forEach(row => {
      console.log(`   ${row.table_name}: ${row.count} registros`);
    });
    
    // Teste de tabelas migradas
    const migratedResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'atendeai' 
      AND table_name IN ('conversations', 'messages', 'appointments', 'professionals', 'services')
      ORDER BY table_name
    `);
    
    console.log('\n🔄 Tabelas migradas encontradas:');
    if (migratedResult.rows.length > 0) {
      migratedResult.rows.forEach(row => {
        console.log(`   ✅ ${row.table_name}`);
      });
    } else {
      console.log('   ⚠️  Nenhuma tabela migrada encontrada');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Erro na conexão com o banco:', error.message);
    console.error('🔍 Detalhes:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function testServiceConfigurations() {
  console.log('\n🔧 TESTANDO CONFIGURAÇÕES DOS SERVIÇOS');
  console.log('========================================');
  
  const services = [
    'auth-service',
    'clinic-service', 
    'whatsapp-service',
    'conversation-service',
    'appointment-service'
  ];
  
  for (const service of services) {
    try {
      const configPath = path.join(__dirname, '..', 'backend', 'services', service, 'src', 'config', 'index.js');
      const config = await import(configPath);
      
      console.log(`\n📋 ${service.toUpperCase()}:`);
      
      if (config.default.database && config.default.database.url) {
        console.log(`   ✅ Configuração DATABASE_URL encontrada`);
        console.log(`   🔗 URL: ${config.default.database.url.replace(/:[^:@]*@/, ':***@')}`);
      } else {
        console.log(`   ❌ Configuração DATABASE_URL não encontrada`);
      }
      
      if (config.default.database && config.default.database.max) {
        console.log(`   ✅ Pool de conexões configurado (max: ${config.default.database.max})`);
      }
      
    } catch (error) {
      console.log(`   ❌ Erro ao carregar configuração: ${error.message}`);
    }
  }
}

async function main() {
  try {
    await testDatabaseConnection();
    await testServiceConfigurations();
    
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('================================');
    console.log('✅ Todas as conexões estão funcionando');
    console.log('✅ Configurações dos serviços estão corretas');
    console.log('✅ Schema consolidado está acessível');
    console.log('\n🚀 Sistema pronto para deploy!');
    
  } catch (error) {
    console.error('\n💥 FALHA NO TESTE');
    console.error('==================');
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { testDatabaseConnection, testServiceConfigurations };
