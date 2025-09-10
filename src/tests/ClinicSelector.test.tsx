import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { ClinicSelector } from '../components/ClinicSelector';
import { ClinicProvider } from '../contexts/ClinicContext';
import { AuthProvider } from '../hooks/useAuth';

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
        <AuthProvider>
          <ClinicProvider>
            {children}
          </ClinicProvider>
        </AuthProvider>
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

    vi.mocked(require('../hooks/useAuth').useAuth).mockReturnValue(mockUseAuthNonAdmin);

    render(
      <TestWrapper>
        <ClinicSelector />
      </TestWrapper>
    );

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });
});
