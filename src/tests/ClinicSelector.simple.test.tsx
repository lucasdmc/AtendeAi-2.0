import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Mock do React Query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    QueryClient: vi.fn().mockImplementation((config) => ({
      ...config,
      getQueryData: vi.fn(),
      setQueryData: vi.fn(),
      invalidateQueries: vi.fn(),
      refetchQueries: vi.fn(),
      cancelQueries: vi.fn(),
      removeQueries: vi.fn(),
      clear: vi.fn(),
      mount: vi.fn(),
      unmount: vi.fn(),
      isFetching: vi.fn(),
      isMutating: vi.fn(),
      getDefaultOptions: vi.fn(),
      setDefaultOptions: vi.fn(),
      getQueryCache: vi.fn(),
      getMutationCache: vi.fn(),
      getLogger: vi.fn(),
      setLogger: vi.fn(),
      defaultOptions: config?.defaultOptions || {}
    })),
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
    useQuery: vi.fn(() => ({
      data: [
        {
          id: '1',
          name: 'Clínica Saúde Total',
          whatsapp_number: '(11) 99999-1111',
          status: 'active'
        },
        {
          id: '2',
          name: 'Centro Médico Bem Estar',
          whatsapp_number: '(11) 88888-2222',
          status: 'active'
        }
      ],
      isLoading: false,
      error: null
    })),
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
    useInfiniteQuery: vi.fn(),
    useIsFetching: vi.fn(),
    useIsMutating: vi.fn()
  };
});

// Mock do React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
    useNavigate: vi.fn(),
    useLocation: vi.fn(),
    useParams: vi.fn(),
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => 
      React.createElement('a', { href: to }, children)
  };
});

// Mock do useAuth
const mockUseAuth = {
  user: {
    id: '1',
    email: 'admin@lify.com',
    role: 'admin',
    clinic_id: '1',
  },
  session: null,
  signOut: vi.fn(),
  isLoading: false,
  isAuthenticated: true,
  isAdminLify: () => true,
  canManageUsers: true,
  canManageClinics: true,
  canViewDashboard: true,
  canAccessConversations: true,
  canAccessCalendar: true,
  canAccessAppointments: true,
};

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth,
}));

// Mock do ClinicContext
const mockClinicContext = {
  selectedClinic: null,
  setSelectedClinic: vi.fn(),
  availableClinics: [
    {
      id: '1',
      name: 'Clínica Saúde Total',
      whatsapp_number: '(11) 99999-1111',
      status: 'active'
    },
    {
      id: '2',
      name: 'Centro Médico Bem Estar',
      whatsapp_number: '(11) 88888-2222',
      status: 'active'
    }
  ],
  canSelectClinic: true,
  isLoading: false,
  error: null
};

vi.mock('../contexts/ClinicContext', () => ({
  ClinicProvider: ({ children }: { children: React.ReactNode }) => children,
  useClinic: () => mockClinicContext,
}));

// Importar o componente após os mocks
import { ClinicSelector } from '../components/ClinicSelector';

describe('ClinicSelector - Testes Simples', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('deve renderizar combobox para admin lify', () => {
    render(<ClinicSelector />);
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Selecionar clínica')).toBeInTheDocument();
  });

  test('deve renderizar sem erros', () => {
    expect(() => render(<ClinicSelector />)).not.toThrow();
  });

  test('deve ter estrutura básica correta', () => {
    render(<ClinicSelector />);
    
    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
  });
});
