// =====================================================
// TEST SETUP - AUTH SERVICE
// Configuração global para testes
// =====================================================

// Configurar variáveis de ambiente para teste
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-very-long-and-secure-for-testing-purposes';
process.env.JWT_ACCESS_TOKEN_EXPIRY = '15m';
process.env.JWT_REFRESH_TOKEN_EXPIRY = '7d';
process.env.BCRYPT_ROUNDS = '12'; // Usar valor padrão para testes
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';

// Configurar timeout global para testes
jest.setTimeout(30000);

// Mock do console para reduzir ruído nos testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock do process.exit para evitar que testes encerrem o processo
process.exit = jest.fn();

// Configurar limpeza após cada teste
afterEach(() => {
  jest.clearAllMocks();
});

// Configurar limpeza após todos os testes
afterAll(() => {
  jest.restoreAllMocks();
});
