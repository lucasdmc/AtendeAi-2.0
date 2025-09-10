// =====================================================
// SMOKE TESTS - AGENDA INTEGRATION
// =====================================================

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import Agenda from '@/pages/Agenda';
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

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient },
      React.createElement(BrowserRouter, null, children)
    );
  };

  return TestWrapper;
};

describe('Agenda Integration Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render agenda page with loading state', () => {
    mockUseGoogleCalendar.mockReturnValue({
      integration: null,
      events: [],
      loading: true,
      authLoading: false,
      syncLoading: false,
      calendarUrl: '',
      handleGoogleAuth: vi.fn(),
      handleDisconnect: vi.fn(),
      handleSync: vi.fn(),
      refreshIntegration: vi.fn(),
      loadEvents: vi.fn(),
      isConnected: false,
      status: 'disconnected'
    });

    const TestWrapper = createTestWrapper();
    render(React.createElement(Agenda), { wrapper: TestWrapper });

    expect(screen.getByText('Agenda')).toBeInTheDocument();
    expect(screen.getByText('Carregando integração...')).toBeInTheDocument();
  });

  test('should render disconnected state with connect button', () => {
    mockUseGoogleCalendar.mockReturnValue({
      integration: null,
      events: [],
      loading: false,
      authLoading: false,
      syncLoading: false,
      calendarUrl: '',
      handleGoogleAuth: vi.fn(),
      handleDisconnect: vi.fn(),
      handleSync: vi.fn(),
      refreshIntegration: vi.fn(),
      loadEvents: vi.fn(),
      isConnected: false,
      status: 'disconnected'
    });

    const TestWrapper = createTestWrapper();
    render(React.createElement(Agenda), { wrapper: TestWrapper });

    expect(screen.getByText('Google Calendar não conectado')).toBeInTheDocument();
    expect(screen.getByText('Conectar Google Calendar')).toBeInTheDocument();
  });

  test('should render connected state with calendar info', () => {
    const mockIntegration = {
      id: 'test-integration-id',
      user_id: 'test-user-id',
      clinic_id: 'test-clinic-id',
      google_calendar_id: 'test-calendar-id',
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      scope: 'calendar',
      token_expiry: '2025-12-31T23:59:59Z',
      calendar_name: 'Test Calendar',
      calendar_description: 'Test Description',
      sync_enabled: true,
      last_sync: '2025-01-27T10:00:00Z',
      status: 'active' as const,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-27T10:00:00Z'
    };

    mockUseGoogleCalendar.mockReturnValue({
      integration: mockIntegration,
      events: [],
      loading: false,
      authLoading: false,
      syncLoading: false,
      calendarUrl: 'https://calendar.google.com/embed?src=test-calendar-id',
      handleGoogleAuth: vi.fn(),
      handleDisconnect: vi.fn(),
      handleSync: vi.fn(),
      refreshIntegration: vi.fn(),
      loadEvents: vi.fn(),
      isConnected: true,
      status: 'active'
    });

    const TestWrapper = createTestWrapper();
    render(React.createElement(Agenda), { wrapper: TestWrapper });

    expect(screen.getByText('Google Calendar Conectado')).toBeInTheDocument();
    expect(screen.getByText('Test Calendar')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  test('should handle connect button click', async () => {
    const mockHandleGoogleAuth = vi.fn();
    
    mockUseGoogleCalendar.mockReturnValue({
      integration: null,
      events: [],
      loading: false,
      authLoading: false,
      syncLoading: false,
      calendarUrl: '',
      handleGoogleAuth: mockHandleGoogleAuth,
      handleDisconnect: vi.fn(),
      handleSync: vi.fn(),
      refreshIntegration: vi.fn(),
      loadEvents: vi.fn(),
      isConnected: false,
      status: 'disconnected'
    });

    const TestWrapper = createTestWrapper();
    render(React.createElement(Agenda), { wrapper: TestWrapper });

    const connectButton = screen.getByText('Conectar Google Calendar');
    fireEvent.click(connectButton);

    await waitFor(() => {
      expect(mockHandleGoogleAuth).toHaveBeenCalledTimes(1);
    });
  });

  test('should handle sync button click', async () => {
    const mockHandleSync = vi.fn();
    const mockIntegration = {
      id: 'test-integration-id',
      user_id: 'test-user-id',
      clinic_id: 'test-clinic-id',
      google_calendar_id: 'test-calendar-id',
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      scope: 'calendar',
      token_expiry: '2025-12-31T23:59:59Z',
      calendar_name: 'Test Calendar',
      calendar_description: 'Test Description',
      sync_enabled: true,
      last_sync: '2025-01-27T10:00:00Z',
      status: 'active' as const,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-27T10:00:00Z'
    };

    mockUseGoogleCalendar.mockReturnValue({
      integration: mockIntegration,
      events: [],
      loading: false,
      authLoading: false,
      syncLoading: false,
      calendarUrl: 'https://calendar.google.com/embed?src=test-calendar-id',
      handleGoogleAuth: vi.fn(),
      handleDisconnect: vi.fn(),
      handleSync: mockHandleSync,
      refreshIntegration: vi.fn(),
      loadEvents: vi.fn(),
      isConnected: true,
      status: 'active'
    });

    const TestWrapper = createTestWrapper();
    render(React.createElement(Agenda), { wrapper: TestWrapper });

    const syncButton = screen.getByText('Sincronizar');
    fireEvent.click(syncButton);

    await waitFor(() => {
      expect(mockHandleSync).toHaveBeenCalledTimes(1);
    });
  });

  test('should handle disconnect button click', async () => {
    const mockHandleDisconnect = vi.fn();
    const mockIntegration = {
      id: 'test-integration-id',
      user_id: 'test-user-id',
      clinic_id: 'test-clinic-id',
      google_calendar_id: 'test-calendar-id',
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      scope: 'calendar',
      token_expiry: '2025-12-31T23:59:59Z',
      calendar_name: 'Test Calendar',
      calendar_description: 'Test Description',
      sync_enabled: true,
      last_sync: '2025-01-27T10:00:00Z',
      status: 'active' as const,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-27T10:00:00Z'
    };

    mockUseGoogleCalendar.mockReturnValue({
      integration: mockIntegration,
      events: [],
      loading: false,
      authLoading: false,
      syncLoading: false,
      calendarUrl: 'https://calendar.google.com/embed?src=test-calendar-id',
      handleGoogleAuth: vi.fn(),
      handleDisconnect: mockHandleDisconnect,
      handleSync: vi.fn(),
      refreshIntegration: vi.fn(),
      loadEvents: vi.fn(),
      isConnected: true,
      status: 'active'
    });

    // Mock window.confirm
    window.confirm = vi.fn(() => true);

    const TestWrapper = createTestWrapper();
    render(React.createElement(Agenda), { wrapper: TestWrapper });

    const disconnectButton = screen.getByText('Desconectar');
    fireEvent.click(disconnectButton);

    await waitFor(() => {
      expect(mockHandleDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  test('should show expired status alert', () => {
    const mockIntegration = {
      id: 'test-integration-id',
      user_id: 'test-user-id',
      clinic_id: 'test-clinic-id',
      google_calendar_id: 'test-calendar-id',
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      scope: 'calendar',
      token_expiry: '2025-01-01T00:00:00Z', // Expired
      calendar_name: 'Test Calendar',
      calendar_description: 'Test Description',
      sync_enabled: true,
      last_sync: '2025-01-27T10:00:00Z',
      status: 'expired' as const,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-27T10:00:00Z'
    };

    mockUseGoogleCalendar.mockReturnValue({
      integration: mockIntegration,
      events: [],
      loading: false,
      authLoading: false,
      syncLoading: false,
      calendarUrl: '',
      handleGoogleAuth: vi.fn(),
      handleDisconnect: vi.fn(),
      handleSync: vi.fn(),
      refreshIntegration: vi.fn(),
      loadEvents: vi.fn(),
      isConnected: true,
      status: 'expired'
    });

    const TestWrapper = createTestWrapper();
    render(React.createElement(Agenda), { wrapper: TestWrapper });

    expect(screen.getByText('Token Expirado')).toBeInTheDocument();
    expect(screen.getByText('Expirado')).toBeInTheDocument();
  });

  test('should show error status alert', () => {
    const mockIntegration = {
      id: 'test-integration-id',
      user_id: 'test-user-id',
      clinic_id: 'test-clinic-id',
      google_calendar_id: 'test-calendar-id',
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      scope: 'calendar',
      token_expiry: '2025-12-31T23:59:59Z',
      calendar_name: 'Test Calendar',
      calendar_description: 'Test Description',
      sync_enabled: true,
      last_sync: '2025-01-27T10:00:00Z',
      status: 'error' as const,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-27T10:00:00Z'
    };

    mockUseGoogleCalendar.mockReturnValue({
      integration: mockIntegration,
      events: [],
      loading: false,
      authLoading: false,
      syncLoading: false,
      calendarUrl: '',
      handleGoogleAuth: vi.fn(),
      handleDisconnect: vi.fn(),
      handleSync: vi.fn(),
      refreshIntegration: vi.fn(),
      loadEvents: vi.fn(),
      isConnected: true,
      status: 'error'
    });

    const TestWrapper = createTestWrapper();
    render(React.createElement(Agenda), { wrapper: TestWrapper });

    expect(screen.getByText('Erro na Integração')).toBeInTheDocument();
    expect(screen.getByText('Erro')).toBeInTheDocument();
  });

  test('should render calendar iframe when connected and active', () => {
    const mockIntegration = {
      id: 'test-integration-id',
      user_id: 'test-user-id',
      clinic_id: 'test-clinic-id',
      google_calendar_id: 'test-calendar-id',
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      scope: 'calendar',
      token_expiry: '2025-12-31T23:59:59Z',
      calendar_name: 'Test Calendar',
      calendar_description: 'Test Description',
      sync_enabled: true,
      last_sync: '2025-01-27T10:00:00Z',
      status: 'active' as const,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-27T10:00:00Z'
    };

    mockUseGoogleCalendar.mockReturnValue({
      integration: mockIntegration,
      events: [],
      loading: false,
      authLoading: false,
      syncLoading: false,
      calendarUrl: 'https://calendar.google.com/embed?src=test-calendar-id',
      handleGoogleAuth: vi.fn(),
      handleDisconnect: vi.fn(),
      handleSync: vi.fn(),
      refreshIntegration: vi.fn(),
      loadEvents: vi.fn(),
      isConnected: true,
      status: 'active'
    });

    const TestWrapper = createTestWrapper();
    render(React.createElement(Agenda), { wrapper: TestWrapper });

    const iframe = screen.getByTitle('Google Calendar');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', 'https://calendar.google.com/embed?src=test-calendar-id');
  });
});
