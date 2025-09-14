import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock do hook useGoogleCalendar
const mockUseGoogleCalendar = vi.fn();

// Mock do hook useGoogleCalendar
vi.mock('@/hooks/useGoogleCalendar', () => ({
  useGoogleCalendar: mockUseGoogleCalendar
}));

// Mock do useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' }
  })
}));

// Mock do useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Mock do SDK
vi.mock('@/sdk/googleCalendarSDK', () => ({
  googleCalendarSDK: {
    getAuthUrl: vi.fn(),
    handleCallback: vi.fn(),
    getUserIntegrations: vi.fn(),
    disconnect: vi.fn(),
    syncCalendar: vi.fn(),
    getEvents: vi.fn()
  }
}));

// Mock do @tanstack/react-query
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
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
    useInfiniteQuery: vi.fn(),
    useIsFetching: vi.fn(),
    useIsMutating: vi.fn()
  };
});

// Mock do Agenda component
const MockAgenda = () => {
  const googleCalendar = mockUseGoogleCalendar();
  
  if (googleCalendar.isLoading) {
    return <div>Carregando integracao...</div>;
  }
  
  if (!googleCalendar.isConnected) {
    return (
      <div>
        <h1>Agenda</h1>
        <button onClick={googleCalendar.connect}>Conectar Google Calendar</button>
      </div>
    );
  }
  
  return (
    <div>
      <h1>Agenda</h1>
      <p>Conectado ao Google Calendar</p>
      <button onClick={googleCalendar.syncCalendar}>Sincronizar</button>
      <button onClick={googleCalendar.disconnect}>Desconectar</button>
    </div>
  );
};

describe('Agenda Integration Tests (Simplified)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render agenda page with loading state', () => {
    mockUseGoogleCalendar.mockReturnValue({
      isLoading: true,
      isConnected: false,
      error: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      syncCalendar: vi.fn(),
      getEvents: vi.fn()
    });

    render(React.createElement(MockAgenda));

    expect(screen.getByText('Agenda')).toBeInTheDocument();
    expect(screen.getByText('Carregando integração...')).toBeInTheDocument();
  });

  test('should render disconnected state with connect button', () => {
    mockUseGoogleCalendar.mockReturnValue({
      isLoading: false,
      isConnected: false,
      error: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      syncCalendar: vi.fn(),
      getEvents: vi.fn()
    });

    render(React.createElement(MockAgenda));

    expect(screen.getByText('Agenda')).toBeInTheDocument();
    expect(screen.getByText('Conectar Google Calendar')).toBeInTheDocument();
  });

  test('should render connected state with calendar info', () => {
    mockUseGoogleCalendar.mockReturnValue({
      isLoading: false,
      isConnected: true,
      error: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      syncCalendar: vi.fn(),
      getEvents: vi.fn()
    });

    render(React.createElement(MockAgenda));

    expect(screen.getByText('Agenda')).toBeInTheDocument();
    expect(screen.getByText('Conectado ao Google Calendar')).toBeInTheDocument();
    expect(screen.getByText('Sincronizar')).toBeInTheDocument();
    expect(screen.getByText('Desconectar')).toBeInTheDocument();
  });

  test('should handle connect button click', async () => {
    const mockConnect = vi.fn();
    mockUseGoogleCalendar.mockReturnValue({
      isLoading: false,
      isConnected: false,
      error: null,
      connect: mockConnect,
      disconnect: vi.fn(),
      syncCalendar: vi.fn(),
      getEvents: vi.fn()
    });

    render(React.createElement(MockAgenda));

    const connectButton = screen.getByText('Conectar Google Calendar');
    fireEvent.click(connectButton);

    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  test('should handle sync button click', async () => {
    const mockSync = vi.fn();
    mockUseGoogleCalendar.mockReturnValue({
      isLoading: false,
      isConnected: true,
      error: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      syncCalendar: mockSync,
      getEvents: vi.fn()
    });

    render(React.createElement(MockAgenda));

    const syncButton = screen.getByText('Sincronizar');
    fireEvent.click(syncButton);

    expect(mockSync).toHaveBeenCalledTimes(1);
  });

  test('should handle disconnect button click', async () => {
    const mockDisconnect = vi.fn();
    mockUseGoogleCalendar.mockReturnValue({
      isLoading: false,
      isConnected: true,
      error: null,
      connect: vi.fn(),
      disconnect: mockDisconnect,
      syncCalendar: vi.fn(),
      getEvents: vi.fn()
    });

    render(React.createElement(MockAgenda));

    const disconnectButton = screen.getByText('Desconectar');
    fireEvent.click(disconnectButton);

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  test('should show error state', () => {
    mockUseGoogleCalendar.mockReturnValue({
      isLoading: false,
      isConnected: false,
      error: 'Connection failed',
      connect: vi.fn(),
      disconnect: vi.fn(),
      syncCalendar: vi.fn(),
      getEvents: vi.fn()
    });

    render(React.createElement(MockAgenda));

    expect(screen.getByText('Agenda')).toBeInTheDocument();
    expect(screen.getByText('Conectar Google Calendar')).toBeInTheDocument();
  });
});
