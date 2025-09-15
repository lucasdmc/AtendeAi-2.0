import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const DATABASE_URL = 'postgresql://postgres:Supa201294base@db.kytphnasmdvebmdvvwtx.supabase.co:5432/postgres';

console.log('🔍 TESTANDO BCRYPT');
console.log('==================');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  connectionTimeoutMillis: 5000,
});

try {
  const client = await pool.connect();
  console.log('✅ Conectado ao banco de dados');
  
  // Buscar usuário
  const userResult = await client.query(`
    SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.status, u.clinic_id,
           array_agg(r.name) as roles
    FROM atendeai.users u
    LEFT JOIN atendeai.user_roles ur ON u.id = ur.user_id
    LEFT JOIN atendeai.roles r ON ur.role_id = r.id
    WHERE u.email = $1 AND u.clinic_id = $2
    GROUP BY u.id, u.email, u.password_hash, u.first_name, u.last_name, u.status, u.clinic_id
  `, ['lucas@lify.com', 'cf0b8ee4-b5ca-4f9d-a7bc-0cf9df8447c1']);
  
  if (userResult.rows.length === 0) {
    console.log('❌ Usuário não encontrado');
    process.exit(1);
  }
  
  const user = userResult.rows[0];
  console.log('✅ Usuário encontrado:');
  console.log(`   Email: ${user.email}`);
  console.log(`   Password Hash: ${user.password_hash}`);
  console.log(`   Roles: ${user.roles.filter(r => r !== null).join(', ')}`);
  
  // Testar senha
  const testPassword = 'lucas123';
  console.log(`\n🔐 Testando senha: "${testPassword}"`);
  
  const isValid = await bcrypt.compare(testPassword, user.password_hash);
  console.log(`Resultado bcrypt.compare: ${isValid ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
  
  if (!isValid) {
    console.log('\n🔧 Criando nova senha com hash mais simples...');
    const newPassword = 'lucas123';
    const newHash = await bcrypt.hash(newPassword, 10); // Salt rounds menor
    
    console.log(`Novo hash: ${newHash}`);
    
    // Atualizar no banco
    await client.query(`
      UPDATE atendeai.users 
      SET password_hash = $1, updated_at = NOW()
      WHERE email = 'lucas@lify.com'
    `, [newHash]);
    
    console.log('✅ Nova senha salva');
    
    // Testar novamente
    const newIsValid = await bcrypt.compare(testPassword, newHash);
    console.log(`Teste com novo hash: ${newIsValid ? '✅ FUNCIONANDO' : '❌ AINDA COM PROBLEMA'}`);
  }
  
  client.release();
  await pool.end();
  
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}
