#!/usr/bin/env node

// =====================================================
// SCRIPT PARA CRIAR USUÁRIOS DE TESTE NO SUPABASE AUTH
// =====================================================

import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const SUPABASE_URL = "https://kytphnasmdvebmdvvwtx.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTYyMjgxMCwiZXhwIjoyMDcxMTk4ODEwfQ.36Ip9NWvqh6aeFQeowV79r54C2YQPc5N-Mn_dn2qD70";

// Criar cliente Supabase com service role key para admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Usuários de teste para criar
const testUsers = [
  {
    email: 'lucas@lify.com',
    password: 'lucas123',
    user_metadata: {
      first_name: 'Lucas',
      last_name: 'Cantoni',
      role: 'admin_lify'
    }
  },
  {
    email: 'admin@lify.com',
    password: 'admin123',
    user_metadata: {
      first_name: 'Admin',
      last_name: 'Lify',
      role: 'admin_lify'
    }
  }
];

async function createTestUsers() {
  console.log('🚀 Criando usuários de teste no Supabase Auth...\n');

  for (const userData of testUsers) {
    try {
      console.log(`📧 Criando usuário: ${userData.email}`);
      
      // Criar usuário no Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: userData.user_metadata,
        email_confirm: true // Confirma email automaticamente
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          console.log(`   ⚠️  Usuário já existe: ${userData.email}`);
        } else {
          console.error(`   ❌ Erro ao criar ${userData.email}:`, error.message);
        }
      } else {
        console.log(`   ✅ Usuário criado com sucesso: ${userData.email}`);
        console.log(`   🆔 ID: ${data.user.id}`);
      }
    } catch (err) {
      console.error(`   ❌ Erro inesperado para ${userData.email}:`, err.message);
    }
    
    console.log(''); // Linha em branco para separar
  }

  console.log('🎉 Processo de criação de usuários concluído!');
  console.log('\n📋 Credenciais de login:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  testUsers.forEach(user => {
    console.log(`📧 ${user.email} | 🔐 ${user.password} | 👤 ${user.user_metadata.role}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🌐 Acesse: http://localhost:8080/auth');
}

// Executar script
createTestUsers().catch(console.error);
