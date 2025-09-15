import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://kytphnasmdvebmdvvwtx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5dHBobmFzbWR2ZWJtZHZ2d3R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjI4MTAsImV4cCI6MjA3MTE5ODgxMH0.gfH3VNqxLZWAbjlrlk44VrBdyF1QKv7CyOSLmhFwbqA";

// Verificar se as variáveis estão definidas
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('❌ Variáveis do Supabase não configuradas:', {
    SUPABASE_URL: !!SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: !!SUPABASE_PUBLISHABLE_KEY
  });
}

// Configuração mínima e robusta do Supabase
let supabase;

try {
  supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  console.log('✅ Cliente Supabase criado com sucesso');
} catch (error) {
  console.error('❌ Erro ao criar cliente Supabase:', error);
  // Fallback com configuração mínima
  supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}

export { supabase };