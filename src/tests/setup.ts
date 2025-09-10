// =====================================================
// TEST SETUP - ATENDEAI 2.0
// Configuração global para testes
// =====================================================

import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

// Mock do React Router
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
}));

// Mock do React Query
vi.mock('@tanstack/react-query', () => ({
  ...vi.importActual('@tanstack/react-query'),
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

// Mock do Toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock do Google Calendar
vi.mock('@/hooks/useGoogleCalendar', () => ({
  useGoogleCalendar: vi.fn(),
}));

// Mock do SDK
vi.mock('@/sdk/googleCalendarSDK', () => ({
  googleCalendarSDK: {
    getAuthUrl: vi.fn(),
    handleCallback: vi.fn(),
    getUserIntegrations: vi.fn(),
    disconnect: vi.fn(),
    syncCalendar: vi.fn(),
    getEvents: vi.fn(),
  },
}));

// Mock do window.confirm
Object.defineProperty(window, 'confirm', {
  value: vi.fn(() => true),
  writable: true,
});

// Mock do window.alert
Object.defineProperty(window, 'alert', {
  value: vi.fn(),
  writable: true,
});

// Mock do console para evitar logs nos testes
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Configurar variáveis de ambiente para testes
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only-32-chars';
process.env.JWT_ACCESS_TOKEN_EXPIRY = '15m';
process.env.JWT_REFRESH_TOKEN_EXPIRY = '7d';
process.env.BCRYPT_ROUNDS = '12';

// Mock do fetch global
global.fetch = vi.fn();

// Configuração global para testes
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
