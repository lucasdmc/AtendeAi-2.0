#!/usr/bin/env node

// Script para testar conexão com banco e estrutura da tabela
import { Pool } from 'pg';

const config = {
  database: {
    connectionString: 'postgresql://postgres:password@localhost:5432/atendeai',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10
  }
};

async function testDatabaseConnection() {
  console.log('🔍 Testando conexão com banco de dados...\n');
  
  const pool = new Pool({
    connectionString: config.database.connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: config.database.connectionTimeout,
    idleTimeoutMillis: config.database.idleTimeout,
    max: config.database.poolSize
  });

  try {
    // Testar conexão
    console.log('1️⃣ Testando conexão...');
    const client = await pool.connect();
    console.log('   ✅ Conexão estabelecida com sucesso');
    
    // Verificar estrutura da tabela
    console.log('\n2️⃣ Verificando estrutura da tabela clinics...');
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'clinics' AND table_schema = 'atendeai'
      ORDER BY ordinal_position
    `);
    
    console.log('   Colunas da tabela clinics:');
    structureResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Testar query de UPDATE simples
    console.log('\n3️⃣ Testando query UPDATE simples...');
    const testId = 'test-id-123';
    
    // Primeiro, inserir um registro de teste
    await client.query(`
      INSERT INTO atendeai.clinics (id, name, whatsapp_id_number, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        whatsapp_id_number = EXCLUDED.whatsapp_id_number,
        status = EXCLUDED.status
    `, [testId, 'Clínica Teste', '+55119999999', 'active']);
    
    console.log('   ✅ Registro de teste inserido');
    
    // Testar UPDATE
    const updateResult = await client.query(`
      UPDATE atendeai.clinics 
      SET status = 'deleted'
      WHERE id = $1
      RETURNING id, name, whatsapp_id_number, status
    `, [testId]);
    
    console.log('   ✅ Query UPDATE executada com sucesso');
    console.log('   Resultado:', updateResult.rows);
    
    // Limpar registro de teste
    await client.query(`DELETE FROM atendeai.clinics WHERE id = $1`, [testId]);
    console.log('   ✅ Registro de teste removido');
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Todos os testes passaram! O banco está funcionando corretamente.');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

testDatabaseConnection();
