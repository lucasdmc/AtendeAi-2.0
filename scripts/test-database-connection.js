#!/usr/bin/env node

// Script para testar conectividade com banco de dados Supabase
import pg from 'pg';

const { Client } = pg;

const DATABASE_URL = 'postgresql://postgres:Supa201294base@db.kytphnasmdvebmdvvwtx.supabase.co:5432/postgres';

async function testDatabaseConnection() {
  console.log('🔍 Testando conexão com banco de dados Supabase...\n');
  
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conexão com banco de dados estabelecida!');
    
    // Testar consulta básica
    const result = await client.query('SELECT version()');
    console.log('📊 Versão do PostgreSQL:', result.rows[0].version);
    
    // Verificar se as tabelas existem
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'atendeai%'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tabelas encontradas:');
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('  ⚠️  Nenhuma tabela atendeai encontrada');
    }
    
    // Testar consulta em uma tabela específica
    try {
      const clinicsResult = await client.query('SELECT COUNT(*) FROM atendeai.clinics');
      console.log(`\n🏥 Clínicas cadastradas: ${clinicsResult.rows[0].count}`);
    } catch (error) {
      console.log('\n⚠️  Tabela atendeai.clinics não encontrada ou sem permissão');
    }
    
    console.log('\n🎉 Teste de conectividade com banco concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao conectar com banco de dados:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

// Executar teste
testDatabaseConnection().catch(console.error);
