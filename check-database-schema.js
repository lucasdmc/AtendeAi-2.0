#!/usr/bin/env node

/**
 * SCRIPT PARA VERIFICAR SCHEMA DO BANCO DE DADOS
 * 
 * Este script conecta ao banco e verifica a estrutura real das tabelas
 */

import { Client } from 'pg';

const config = {
  host: 'aws-1-us-east-2.pooler.supabase.com',
  port: 5432,
  user: 'postgres.kytphnasmdvebmdvvwtx',
  password: 'lify2025supa',
  database: 'postgres',
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 5
};

async function checkSchema() {
  console.log('🔍 VERIFICANDO SCHEMA DO BANCO DE DADOS');
  console.log('=' .repeat(60));
  
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar se o schema atendeai existe
    console.log('\n1️⃣ VERIFICANDO SCHEMAS');
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE '%atendeai%' OR schema_name LIKE '%clinic%' OR schema_name LIKE '%conversation%'
      ORDER BY schema_name
    `);
    
    console.log('Schemas encontrados:');
    schemasResult.rows.forEach(row => {
      console.log(`  - ${row.schema_name}`);
    });
    
    // Verificar tabelas no schema atendeai
    console.log('\n2️⃣ VERIFICANDO TABELAS NO SCHEMA ATENDEAI');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'atendeai'
      ORDER BY table_name
    `);
    
    console.log('Tabelas encontradas:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Verificar estrutura da tabela clinics
    console.log('\n3️⃣ VERIFICANDO ESTRUTURA DA TABELA CLINICS');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'atendeai' AND table_name = 'clinics'
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas da tabela clinics:');
    columnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Verificar estrutura da tabela users
    console.log('\n4️⃣ VERIFICANDO ESTRUTURA DA TABELA USERS');
    const usersColumnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'atendeai' AND table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas da tabela users:');
    usersColumnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Verificar estrutura da tabela user_roles
    console.log('\n5️⃣ VERIFICANDO ESTRUTURA DA TABELA USER_ROLES');
    const userRolesColumnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'atendeai' AND table_name = 'user_roles'
      ORDER BY ordinal_position
    `);
    
    console.log('Colunas da tabela user_roles:');
    userRolesColumnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Testar query simples na tabela clinics
    console.log('\n6️⃣ TESTANDO QUERY SIMPLES NA TABELA CLINICS');
    try {
      const testResult = await client.query(`
        SELECT id, name, status, created_at
        FROM atendeai.clinics
        LIMIT 1
      `);
      console.log('✅ Query simples funcionou');
      console.log(`Resultado: ${JSON.stringify(testResult.rows[0] || 'Nenhum registro encontrado')}`);
    } catch (error) {
      console.log('❌ Erro na query simples:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Erro ao conectar:', error.message);
  } finally {
    await client.end();
  }
}

checkSchema().catch(console.error);
