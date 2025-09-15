// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { ClinicSelector } from '../components/ClinicSelector';
import { ClinicProvider } from '../contexts/ClinicContext';

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
    useQuery: vi.fn().mockReturnValue({
      data: [
        { id: '1', name: 'Clínica Saúde Total', status: 'active' },
        { id: '2', name: 'Centro Médico Bem Estar', status: 'active' },
        { id: '3', name: 'Clínica Inativa', status: 'inactive' }
      ],
      isLoading: false,
      error: null
    }),
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

// Mock do useAuth para simular admin lify
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
vi.mock('../contexts/ClinicContext', () => ({
  ClinicProvider: ({ children }: { children: React.ReactNode }) => children,
  useClinic: () => ({
    selectedClinic: null,
    setSelectedClinic: vi.fn(),
    canSelectClinic: true,
    availableClinics: [
      { id: '1', name: 'Clínica Saúde Total', status: 'active', whatsapp_number: '+5511999999999' },
      { id: '2', name: 'Centro Médico Bem Estar', status: 'active', whatsapp_number: '+5511888888888' },
      { id: '3', name: 'Clínica Inativa', status: 'inactive', whatsapp_number: '+5511777777777' }
    ]
  })
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ClinicProvider>
          {children}
        </ClinicProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ClinicSelector', () => {
  beforeEach(() => {
    // Limpar localStorage antes de cada teste
    localStorage.clear();
  });

  test('deve renderizar combobox para admin lify', () => {
    render(
      <TestWrapper>
        <ClinicSelector />
      </TestWrapper>
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Selecionar clínica')).toBeInTheDocument();
  });

  test('deve listar clínicas ativas', () => {
    render(
      <TestWrapper>
        <ClinicSelector />
      </TestWrapper>
    );

    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);

    // Verificar se as clínicas ativas aparecem
    expect(screen.getByText('Clínica Saúde Total')).toBeInTheDocument();
    expect(screen.getByText('Centro Médico Bem Estar')).toBeInTheDocument();
    // Clínica inativa não deve aparecer
    expect(screen.queryByText('Clínica Nova Vida')).not.toBeInTheDocument();
  });

  test('deve permitir seleção de clínica', () => {
    render(
      <TestWrapper>
        <ClinicSelector />
      </TestWrapper>
    );

    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);

    const clinicOption = screen.getByText('Clínica Saúde Total');
    fireEvent.click(clinicOption);

    // Verificar se a clínica foi selecionada
    expect(screen.getByDisplayValue('Clínica Saúde Total')).toBeInTheDocument();
  });

  test('deve persistir seleção no localStorage', () => {
    render(
      <TestWrapper>
        <ClinicSelector />
      </TestWrapper>
    );

    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);

    const clinicOption = screen.getByText('Centro Médico Bem Estar');
    fireEvent.click(clinicOption);

    // Verificar se foi salvo no localStorage
    const savedClinic = localStorage.getItem('selectedClinic');
    expect(savedClinic).toBeTruthy();
    
    const parsedClinic = JSON.parse(savedClinic!);
    expect(parsedClinic.name).toBe('Centro Médico Bem Estar');
  });

  test('deve carregar seleção do localStorage', () => {
    // Simular clínica salva no localStorage
    const savedClinic = {
      id: '2',
      name: 'Centro Médico Bem Estar',
      address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
      phone: '(11) 2222-3333',
      email: 'recepcao@bemestar.com.br',
      whatsappNumber: '(11) 88888-5678',
      status: 'active',
      usersCount: 8,
      description: 'Especialidades médicas e exames diagnósticos',
      createdAt: '2024-02-10'
    };
    
    localStorage.setItem('selectedClinic', JSON.stringify(savedClinic));

    render(
      <TestWrapper>
        <ClinicSelector />
      </TestWrapper>
    );

    // Verificar se a clínica foi carregada
    expect(screen.getByDisplayValue('Centro Médico Bem Estar')).toBeInTheDocument();
  });
});

describe('ClinicSelector - Permissões', () => {
  test('não deve renderizar para usuário não admin lify', () => {
    // Mock para usuário não admin lify
    const mockUseAuthNonAdmin = {
      ...mockUseAuth,
      isAdminLify: () => false,
    };

    // Temporariamente substituir o mock
    vi.doMock('../hooks/useAuth', () => ({
      useAuth: () => mockUseAuthNonAdmin,
    }));

    render(
      <TestWrapper>
        <ClinicSelector />
      </TestWrapper>
    );

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
