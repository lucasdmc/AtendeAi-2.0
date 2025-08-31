import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '@/pages/Dashboard';
import { useAuth } from '@/hooks/useAuth';
import { conversationService } from '@/services/conversationService';
import { appointmentService } from '@/services/appointmentService';
import { clinicService } from '@/services/clinicService';
import { userService } from '@/services/userService';

// Mock dependencies
vi.mock('@/hooks/useAuth');
vi.mock('@/services/conversationService');
vi.mock('@/services/appointmentService');
vi.mock('@/services/clinicService');
vi.mock('@/services/userService');
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockUseAuth = useAuth as any;
const mockConversationService = conversationService as any;
const mockAppointmentService = appointmentService as any;
const mockClinicService = clinicService as any;
const mockUserService = userService as any;

describe('Dashboard', () => {
  const mockUser = {
    id: 'user-1',
    name: 'João Silva',
    role: 'atendente',
    clinic_id: 'clinic-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default auth mock
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAdminLify: vi.fn().mockResolvedValue(false),
    });

    // Setup default service mocks
    mockConversationService.getConversationStats.mockResolvedValue({
      total: 10,
      active: 5,
      bot_active: 3,
      human_active: 2,
      unassigned: 1,
    });

    mockAppointmentService.getStats.mockResolvedValue({
      total: 15,
      today: 3,
      this_week: 8,
      confirmed: 12,
      completed: 5,
    });

    mockAppointmentService.getUpcoming.mockResolvedValue([
      {
        id: 'apt-1',
        patient_name: 'Maria Silva',
        appointment_type: 'Consulta',
        appointment_date: '2024-01-15T10:00:00Z',
        duration_minutes: 30,
        status: 'confirmed',
      },
    ]);

    mockConversationService.list.mockResolvedValue({
      data: [
        {
          id: 'conv-1',
          customer_phone: '+5511999999999',
          bot_active: true,
          status: 'active',
          updated_at: '2024-01-15T09:00:00Z',
        },
      ],
      pagination: { page: 1, limit: 5, total: 1, pages: 1, has_next: false, has_prev: false },
    });

    mockUserService.getActiveUserCount.mockResolvedValue(5);
    mockClinicService.getActiveClinicCount.mockResolvedValue(2);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should render dashboard with stats cards', async () => {
    // Act
    render(<Dashboard />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Visão geral e métricas do sistema')).toBeInTheDocument();
    });

    // Check stats cards
    expect(screen.getByText('Conversas')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // Total conversations
    expect(screen.getByText('5 ativas')).toBeInTheDocument();
    expect(screen.getByText('3 bot')).toBeInTheDocument();

    expect(screen.getByText('Agendamentos')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // Total appointments
    expect(screen.getByText('3 hoje')).toBeInTheDocument();
    expect(screen.getByText('12 confirmados')).toBeInTheDocument();
  });

  it('should show user management card for admin users', async () => {
    // Arrange
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, role: 'admin_lify' },
      isAdminLify: vi.fn().mockResolvedValue(true),
    });

    // Act
    render(<Dashboard />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Usuários')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Total users
    });
  });

  it('should show clinic management card for Admin Lify only', async () => {
    // Arrange
    mockUseAuth.mockReturnValue({
      user: { ...mockUser, role: 'admin_lify' },
      isAdminLify: vi.fn().mockResolvedValue(true),
    });

    // Act
    render(<Dashboard />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Clínicas')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Total clinics
    });
  });

  it('should not show clinic card for non-admin users', async () => {
    // Act
    render(<Dashboard />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    expect(screen.queryByText('Clínicas')).not.toBeInTheDocument();
  });

  it('should display recent activity', async () => {
    // Act
    render(<Dashboard />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Atividade Recente')).toBeInTheDocument();
      expect(screen.getByText('Conversa com +5511999999999')).toBeInTheDocument();
      expect(screen.getByText('Atendimento via chatbot')).toBeInTheDocument();
    });
  });

  it('should display upcoming appointments', async () => {
    // Act
    render(<Dashboard />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Próximos Agendamentos')).toBeInTheDocument();
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
      expect(screen.getByText('Consulta')).toBeInTheDocument();
      expect(screen.getByText('30min')).toBeInTheDocument();
    });
  });

  it('should handle refresh button click', async () => {
    // Arrange
    const user = userEvent.setup();

    // Act
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /atualizar/i });
    await user.click(refreshButton);

    // Assert
    await waitFor(() => {
      expect(mockConversationService.getConversationStats).toHaveBeenCalledTimes(2);
      expect(mockAppointmentService.getStats).toHaveBeenCalledTimes(2);
    });
  });

  it('should show loading state initially', () => {
    // Arrange
    mockConversationService.getConversationStats.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    // Act
    render(<Dashboard />);

    // Assert
    expect(screen.getByText('Carregando dashboard...')).toBeInTheDocument();
  });

  it('should display empty state for no recent activity', async () => {
    // Arrange
    mockConversationService.list.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 5, total: 0, pages: 0, has_next: false, has_prev: false },
    });

    // Act
    render(<Dashboard />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Nenhuma atividade recente')).toBeInTheDocument();
    });
  });

  it('should display empty state for no upcoming appointments', async () => {
    // Arrange
    mockAppointmentService.getUpcoming.mockResolvedValue([]);

    // Act
    render(<Dashboard />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Nenhum agendamento próximo')).toBeInTheDocument();
    });
  });

  it('should display system status information', async () => {
    // Act
    render(<Dashboard />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Status do Sistema')).toBeInTheDocument();
      expect(screen.getByText('WhatsApp Service')).toBeInTheDocument();
      expect(screen.getByText('Google Calendar')).toBeInTheDocument();
      expect(screen.getByText('Database')).toBeInTheDocument();
      expect(screen.getAllByText('Conectado')).toHaveLength(1);
      expect(screen.getByText('Sincronizado')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
    });
  });

  it('should display contextualização notice', async () => {
    // Act
    render(<Dashboard />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/Este dashboard apresenta dados em tempo real/)).toBeInTheDocument();
      expect(screen.getByText(/Os dados são filtrados automaticamente/)).toBeInTheDocument();
    });
  });

  it('should format appointment time correctly', async () => {
    // Arrange
    const appointmentDate = '2024-01-15T14:30:00Z';
    mockAppointmentService.getUpcoming.mockResolvedValue([
      {
        id: 'apt-1',
        patient_name: 'João Silva',
        appointment_type: 'Consulta',
        appointment_date: appointmentDate,
        duration_minutes: 60,
        status: 'confirmed',
      },
    ]);

    // Act
    render(<Dashboard />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('60min')).toBeInTheDocument();
      // Time will be formatted to local timezone
      expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
    });
  });

  it('should handle error loading dashboard data gracefully', async () => {
    // Arrange
    mockConversationService.getConversationStats.mockRejectedValue(
      new Error('Network error')
    );

    // Act
    render(<Dashboard />);

    // Assert
    await waitFor(() => {
      // Should not show loading state anymore
      expect(screen.queryByText('Carregando dashboard...')).not.toBeInTheDocument();
      // Should still render the basic structure
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});
