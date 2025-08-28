// Setup global para testes
global.console = {
    ...console,
    // Suprimir logs durante testes
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Mock do fetch global
global.fetch = jest.fn();

// Mock do process.env
process.env.NODE_ENV = 'test';
process.env.WHATSAPP_ACCESS_TOKEN = 'test_token';
process.env.WHATSAPP_PHONE_NUMBER_ID = 'test_phone_id';
process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = 'test_business_id';
process.env.WHATSAPP_VERIFY_TOKEN = 'test_verify_token';
process.env.WHATSAPP_APP_SECRET = 'test_app_secret';
process.env.CONVERSATION_SERVICE_URL = 'http://localhost:3005';
process.env.CONVERSATION_SERVICE_TOKEN = 'test_conv_token';
process.env.CLINIC_SERVICE_URL = 'http://localhost:3003';
process.env.CLINIC_SERVICE_TOKEN = 'test_clinic_token';

// Mock do Prometheus client
global.prometheusClient = {
    gauge: jest.fn(),
    counter: jest.fn(),
    histogram: jest.fn()
};

// Mock do banco de dados
jest.mock('../src/config/database', () => ({
    query: jest.fn()
}));

// Mock do Redis
jest.mock('../src/config/redis', () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn()
}));

// Configurar timers para testes
jest.useFakeTimers();

// Cleanup após cada teste
afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
});
