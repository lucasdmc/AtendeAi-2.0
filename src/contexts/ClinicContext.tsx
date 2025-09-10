import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Clinic {
  id: string;
  name: string;
  whatsapp_number: string;
  meta_webhook_url: string;
  whatsapp_id: string;
  context_json: {
    clinica: {
      informacoes_basicas: {
        nome: string;
        descricao: string;
      };
      localizacao: {
        endereco_principal: string;
      };
      contatos: {
        telefone_principal: string;
        email_principal: string;
      };
    };
  };
  simulation_mode: boolean;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface ClinicContextType {
  selectedClinic: Clinic | null;
  setSelectedClinic: (clinic: Clinic | null) => void;
  clinics: Clinic[];
  setClinics: (clinics: Clinic[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

interface ClinicProviderProps {
  children: ReactNode;
}

export const ClinicProvider = ({ children }: ClinicProviderProps) => {
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar clínicas da API
  useEffect(() => {
    const fetchClinics = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/clinics');
        if (response.ok) {
          const data = await response.json();
          setClinics(data);
          // Selecionar primeira clínica ativa por padrão
          const firstActiveClinic = data.find((clinic: Clinic) => clinic.status === 'active');
          if (firstActiveClinic) {
            setSelectedClinic(firstActiveClinic);
          }
        } else {
          console.error('Erro ao carregar clínicas:', response.statusText);
        }
      } catch (error) {
        console.error('Erro ao carregar clínicas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinics();
  }, []);

  // Persistir seleção no localStorage
  useEffect(() => {
    if (selectedClinic) {
      localStorage.setItem('selectedClinic', JSON.stringify(selectedClinic));
    }
  }, [selectedClinic]);

  // Carregar seleção do localStorage na inicialização
  useEffect(() => {
    const savedClinic = localStorage.getItem('selectedClinic');
    if (savedClinic) {
      try {
        const parsedClinic = JSON.parse(savedClinic);
        setSelectedClinic(parsedClinic);
      } catch (error) {
        console.error('Erro ao carregar clínica selecionada:', error);
      }
    }
  }, []);

  const value: ClinicContextType = {
    selectedClinic,
    setSelectedClinic,
    clinics,
    setClinics,
    isLoading,
    setIsLoading,
  };

  return (
    <ClinicContext.Provider value={value}>
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = (): ClinicContextType => {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};

export default useClinic;
