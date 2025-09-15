#!/usr/bin/env node

// =====================================================
// CONFIRMAR USUÁRIO LUCAS@LIFY.COM NO SUPABASE AUTH
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

async function confirmLucasUser() {
  console.log('🔐 Confirmando usuário lucas@lify.com...\n');

  try {
    // Buscar usuário por email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('❌ Erro ao listar usuários:', listError.message);
      return;
    }

    const lucasUser = users.users.find(user => user.email === 'lucas@lify.com');
    
    if (!lucasUser) {
      console.log('❌ Usuário lucas@lify.com não encontrado');
      return;
    }

    console.log('👤 Usuário encontrado:', lucasUser.email);
    console.log('📧 Email confirmado:', lucasUser.email_confirmed_at ? 'Sim' : 'Não');

    if (lucasUser.email_confirmed_at) {
      console.log('✅ Usuário já está confirmado!');
      return;
    }

    // Confirmar email do usuário
    const { data, error } = await supabase.auth.admin.updateUserById(lucasUser.id, {
      email_confirm: true
    });

    if (error) {
      console.log('❌ Erro ao confirmar usuário:', error.message);
    } else {
      console.log('✅ Usuário lucas@lify.com confirmado com sucesso!');
      console.log('📧 Email confirmado em:', data.user?.email_confirmed_at);
    }

  } catch (err) {
    console.log('❌ Erro inesperado:', err.message);
  }
}

// Executar confirmação
confirmLucasUser().catch(console.error);
