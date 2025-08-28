// =====================================================
// CONFIGURAÇÃO DE TESTES - ATENDEAÍ 2.0
// =====================================================

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock do sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock do window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
});

// Mock do window.performance
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    measure: vi.fn(),
    mark: vi.fn(),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000,
    },
  },
  writable: true,
});

// Mock do fetch global
global.fetch = vi.fn();

// Mock do IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock do ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock do matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Suppress console warnings em testes
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.warn = (...args: any[]) => {
  // Suprimir warnings específicos que são esperados em testes
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render') ||
     args[0].includes('Warning: An invalid form control') ||
     args[0].includes('Warning: findDOMNode'))
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

console.error = (...args: any[]) => {
  // Suprimir errors específicos que são esperados em testes
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Error: Not implemented') ||
     args[0].includes('Error: Uncaught'))
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// Helper para aguardar próximo tick
export const nextTick = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper para aguardar um tempo específico
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para simular delay em mocks
export const createDelayedMock = <T>(value: T, delay: number = 100) => {
  return vi.fn().mockImplementation(() => 
    new Promise(resolve => setTimeout(() => resolve(value), delay))
  );
};

// Helper para simular erro em mocks
export const createErrorMock = (error: Error, delay: number = 100) => {
  return vi.fn().mockImplementation(() => 
    new Promise((_, reject) => setTimeout(() => reject(error), delay))
  );
};

// Configuração global para testes de performance
export const performanceTestConfig = {
  timeouts: {
    auth: 100,
    dataLoad: 500,
    render: 200,
    network: 1000,
  },
  thresholds: {
    memoryLeak: 10 * 1024 * 1024, // 10MB
    bundleSize: 1.5 * 1024 * 1024, // 1.5MB
    firstPaint: 1000, // 1s
    interactive: 2500, // 2.5s
  },
};

// Mock de dados de teste padrão
export const mockTestData = {
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    role: 'admin_lify' as const,
    clinic_id: null,
  },
  clinic: {
    id: 'test-clinic-123',
    name: 'Clínica Teste',
    phone: '+5511999999999',
    webhook_url: 'https://api.example.com/webhook',
    whatsapp_number: '999999999',
    config: {},
  },
  conversation: {
    id: 'test-conv-123',
    clinic_id: 'test-clinic-123',
    customer_phone: '+5511888888888',
    customer_name: 'Cliente Teste',
    status: 'active' as const,
    last_message_at: '2024-01-01T14:30:00Z',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T14:30:00Z',
    messages: [],
  },
  message: {
    id: 'test-msg-123',
    conversation_id: 'test-conv-123',
    from: '+5511888888888',
    to: '+5511999999999',
    message_type: 'text' as const,
    content: 'Mensagem de teste',
    timestamp: '2024-01-01T14:30:00Z',
    status: 'sent' as const,
    is_from_customer: true,
  },
};

// Cleanup global após todos os testes
afterEach(() => {
  // Reset all mocks
  vi.resetAllMocks();
  
  // Clear all storages
  localStorageMock.clear();
  sessionStorageMock.clear();
  
  // Reset fetch mock
  if (global.fetch) {
    vi.mocked(global.fetch).mockClear();
  }
});
