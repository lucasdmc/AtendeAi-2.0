// Custom hooks for API integration
import { useState, useEffect, useCallback } from 'react';
import { 
  clinicApi, 
  conversationApi, 
  appointmentApi, 
  authApi, 
  whatsappApi,
  handleApiError,
  type Clinic,
  type User,
  type Conversation,
  type Message,
  type Appointment
} from '@/services/api';

// Generic hook for API calls with loading and error states
export function useApiCall<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

// Clinic hooks
export function useClinics() {
  return useApiCall(() => clinicApi.getClinics());
}

export function useClinic(id: string) {
  return useApiCall(() => clinicApi.getClinic(id), [id]);
}

export function useClinicProfessionals(clinicId: string) {
  return useApiCall(() => clinicApi.getClinicProfessionals(clinicId), [clinicId]);
}

export function useClinicServices(clinicId: string) {
  return useApiCall(() => clinicApi.getClinicServices(clinicId), [clinicId]);
}

// Conversation hooks
export function useConversations(clinicId: string, limit = 50, offset = 0) {
  return useApiCall(
    () => conversationApi.getConversations(clinicId, limit, offset),
    [clinicId, limit, offset]
  );
}

export function useActiveConversations(clinicId: string) {
  return useApiCall(() => conversationApi.getActiveConversations(clinicId), [clinicId]);
}

export function useConversationHistory(clinicId: string, patientPhone: string, limit = 50, offset = 0) {
  return useApiCall(
    () => conversationApi.getConversationHistory(clinicId, patientPhone, limit, offset),
    [clinicId, patientPhone, limit, offset]
  );
}

// Appointment hooks
export function useAppointments(clinicId?: string, limit = 50, offset = 0) {
  return useApiCall(
    () => appointmentApi.getAppointments(clinicId, limit, offset),
    [clinicId, limit, offset]
  );
}

export function useAppointment(id: string) {
  return useApiCall(() => appointmentApi.getAppointment(id), [id]);
}

// Auth hooks
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string, clinicId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authApi.login(email, password, clinicId);
      if (result.success) {
        localStorage.setItem('auth_token', result.data.accessToken);
        localStorage.setItem('refresh_token', result.data.refreshToken);
        setUser(result.data.user);
        return result;
      }
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      const clinicId = user?.clinic_id;
      if (refreshToken && clinicId) {
        await authApi.logout(refreshToken, clinicId);
      }
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  }, [user]);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.validateToken();
      if (result.success && result.data.valid) {
        setUser(result.data.user);
      } else {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
      }
    } catch (err) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return { user, loading, error, login, logout, checkAuth };
}

// WhatsApp hooks
export function useWhatsApp() {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (data: {
    clinic_id: string;
    to: string;
    message: string;
    type?: string;
  }) => {
    setSending(true);
    setError(null);
    
    try {
      const result = await whatsappApi.sendMessage(data);
      return result;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setSending(false);
    }
  }, []);

  const getMessageStatus = useCallback(async (messageId: string) => {
    try {
      return await whatsappApi.getMessageStatus(messageId);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    }
  }, []);

  const getClinicContext = useCallback(async (clinicId: string) => {
    try {
      return await whatsappApi.getClinicContext(clinicId);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    }
  }, []);

  return { sendMessage, getMessageStatus, getClinicContext, sending, error };
}

// Utility hook for pagination
export function usePagination<T>(
  apiCall: (limit: number, offset: number) => Promise<{
    data: T[];
    pagination: { total: number; limit: number; offset: number };
  }>,
  initialLimit = 50
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: initialLimit,
    offset: 0,
  });

  const loadData = useCallback(async (limit = initialLimit, offset = 0) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall(limit, offset);
      setData(result.data);
      setPagination(result.pagination);
      return result;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall, initialLimit]);

  const loadMore = useCallback(() => {
    if (pagination.offset + pagination.limit < pagination.total) {
      return loadData(pagination.limit, pagination.offset + pagination.limit);
    }
  }, [loadData, pagination]);

  const refresh = useCallback(() => {
    return loadData(pagination.limit, 0);
  }, [loadData, pagination.limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    pagination,
    loadMore,
    refresh,
    hasMore: pagination.offset + pagination.limit < pagination.total,
  };
}

// Hook for real-time updates (WebSocket integration)
export function useRealtimeUpdates<T>(
  endpoint: string,
  onUpdate: (data: T) => void
) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Implement WebSocket connection for real-time updates
    // This would connect to a WebSocket endpoint and listen for updates
    console.log('Real-time updates not implemented yet for:', endpoint);
  }, [endpoint, onUpdate]);

  return { connected, error };
}
