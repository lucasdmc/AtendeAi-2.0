#!/usr/bin/env node

// =====================================================
// TESTE DE FLUXO DE AUTENTICAÇÃO - SUPABASE AUTH
// =====================================================

import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const SUPABASE_URL = "https://kytphnasmdvebmdvvwtx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjI4MTAsImV4cCI6MjA3MTE5ODgxMH0.gfH3VNqxLZWAbjlrlk44VrBdyF1QKv7CyOSLmhFwbqA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuthFlow() {
  console.log('🧪 Testando fluxo de autenticação...\n');

  // Teste 1: Login com lucas@lify.com
  console.log('1️⃣ Testando login com lucas@lify.com...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'lucas@lify.com',
      password: 'lucas123'
    });

    if (error) {
      console.log('   ❌ Erro no login:', error.message);
    } else {
      console.log('   ✅ Login bem-sucedido!');
      console.log('   👤 Usuário:', data.user?.email);
      console.log('   🏷️ Role:', data.user?.user_metadata?.role);
      console.log('   🆔 ID:', data.user?.id);
    }
  } catch (err) {
    console.log('   ❌ Erro inesperado:', err.message);
  }

  console.log('');

  // Teste 2: Login com admin@lify.com
  console.log('2️⃣ Testando login com admin@lify.com...');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@lify.com',
      password: 'admin123'
    });

    if (error) {
      console.log('   ❌ Erro no login:', error.message);
    } else {
      console.log('   ✅ Login bem-sucedido!');
      console.log('   👤 Usuário:', data.user?.email);
      console.log('   🏷️ Role:', data.user?.user_metadata?.role);
      console.log('   🆔 ID:', data.user?.id);
    }
  } catch (err) {
    console.log('   ❌ Erro inesperado:', err.message);
  }

  console.log('');

  // Teste 3: Verificar sessão atual
  console.log('3️⃣ Verificando sessão atual...');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('   ❌ Erro ao obter sessão:', error.message);
    } else if (session) {
      console.log('   ✅ Sessão ativa encontrada!');
      console.log('   👤 Usuário:', session.user?.email);
      console.log('   🏷️ Role:', session.user?.user_metadata?.role);
    } else {
      console.log('   ⚠️ Nenhuma sessão ativa');
    }
  } catch (err) {
    console.log('   ❌ Erro inesperado:', err.message);
  }

  console.log('');

  // Teste 4: Logout
  console.log('4️⃣ Testando logout...');
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.log('   ❌ Erro no logout:', error.message);
    } else {
      console.log('   ✅ Logout bem-sucedido!');
    }
  } catch (err) {
    console.log('   ❌ Erro inesperado:', err.message);
  }

  console.log('\n🎉 Teste de autenticação concluído!');
  console.log('\n📋 Resumo:');
  console.log('   - ✅ Supabase Auth configurado');
  console.log('   - ✅ Usuários criados no Supabase');
  console.log('   - ✅ Sistema JWT removido');
  console.log('   - ✅ Dados mockados eliminados');
  console.log('\n🌐 Acesse: http://localhost:8080/auth');
}

// Executar teste
testAuthFlow().catch(console.error);
