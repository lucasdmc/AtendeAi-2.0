// =====================================================
// CONTEXTO GLOBAL DA APLICAÇÃO - ATENDEAÍ 2.0
// =====================================================

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Tipos de estado
interface AppState {
  selectedClinic: string;
  clinics: Array<{ id: string; name: string; status: string }>;
  isLoading: boolean;
  error: string | null;
  lastSync: string | null;
}

// Tipos de ações
type AppAction =
  | { type: 'SET_SELECTED_CLINIC'; payload: string }
  | { type: 'SET_CLINICS'; payload: Array<{ id: string; name: string; status: string }> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LAST_SYNC'; payload: string }
  | { type: 'RESET_STATE' };

// Estado inicial
const initialState: AppState = {
  selectedClinic: '',
  clinics: [],
  isLoading: false,
  error: null,
  lastSync: null,
};

// Reducer para gerenciar estado
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SELECTED_CLINIC':
      return {
        ...state,
        selectedClinic: action.payload,
      };
    case 'SET_CLINICS':
      return {
        ...state,
        clinics: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'SET_LAST_SYNC':
      return {
        ...state,
        lastSync: action.payload,
      };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

// Contexto
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setSelectedClinic: (clinicId: string) => void;
  setClinics: (clinics: Array<{ id: string; name: string; status: string }>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  // Carregar estado persistido do localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      loadPersistedState();
    }
  }, [isAuthenticated, user]);

  // Persistir estado no localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      persistState();
    }
  }, [state, isAuthenticated, user]);

  // Limpar estado quando usuário deslogar
  useEffect(() => {
    if (!isAuthenticated) {
      resetState();
    }
  }, [isAuthenticated]);

  const loadPersistedState = () => {
    try {
      const persistedState = localStorage.getItem(`app_state_${user?.id}`);
      if (persistedState) {
        const parsedState = JSON.parse(persistedState);
        
        // Validar e restaurar estado
        if (parsedState.selectedClinic) {
          dispatch({ type: 'SET_SELECTED_CLINIC', payload: parsedState.selectedClinic });
        }
        if (parsedState.lastSync) {
          dispatch({ type: 'SET_LAST_SYNC', payload: parsedState.lastSync });
        }
      }
    } catch (error) {
      console.error('Error loading persisted state:', error);
      // Em caso de erro, limpar localStorage corrompido
      localStorage.removeItem(`app_state_${user?.id}`);
    }
  };

  const persistState = () => {
    try {
      const stateToPersist = {
        selectedClinic: state.selectedClinic,
        lastSync: state.lastSync,
      };
      
      localStorage.setItem(`app_state_${user?.id}`, JSON.stringify(stateToPersist));
    } catch (error) {
      console.error('Error persisting state:', error);
    }
  };

  const setSelectedClinic = (clinicId: string) => {
    dispatch({ type: 'SET_SELECTED_CLINIC', payload: clinicId });
  };

  const setClinics = (clinics: Array<{ id: string; name: string; status: string }>) => {
    dispatch({ type: 'SET_CLINICS', payload: clinics });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
    
    // Limpar localStorage
    if (user?.id) {
      localStorage.removeItem(`app_state_${user.id}`);
    }
  };

  const value: AppContextType = {
    state,
    dispatch,
    setSelectedClinic,
    setClinics,
    setLoading,
    setError,
    resetState,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Hook para usar o contexto
export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
