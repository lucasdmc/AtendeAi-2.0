// Polyfills para compatibilidade com Supabase
// Este arquivo deve ser importado antes de qualquer uso do Supabase

// Polyfill para global object - necessário para o Supabase funcionar
if (typeof global === 'undefined') {
  (window as any).global = globalThis;
}

// Garantir que global.headers existe
if (typeof global !== 'undefined' && !global.headers) {
  global.headers = {};
}

// Polyfill para process.env se necessário
if (typeof process === 'undefined') {
  (window as any).process = { env: {} };
}

console.log('✅ Polyfills aplicados com sucesso');
