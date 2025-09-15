import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { clinicApi } from '@/services/api';

interface Clinic {
  id: string;
  name: string;
  whatsapp_number: string;
  meta_webhook_url?: string;
  whatsapp_id?: string;
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
    servicos?: any[];
    profissionais?: any[];
    politicas?: any;
  };
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
  canSelectClinic: boolean;
  availableClinics: Clinic[];
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

interface ClinicProviderProps {
  children: ReactNode;
}

export const ClinicProvider = ({ children }: ClinicProviderProps) => {
  const { user, isAdminLify } = useAuth();
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Determine if user can select clinic (admin_lify can see all clinics)
  const canSelectClinic = user?.user_metadata?.role === 'admin_lify' || user?.user_metadata?.role === 'suporte_lify';
  
  
  // Available clinics based on user role
  const availableClinics = canSelectClinic 
    ? clinics.filter(clinic => clinic.status === 'active')
    : clinics.filter(clinic => clinic.id === user?.clinic_id && clinic.status === 'active');


  // Carregar clínicas da API real do microserviço
  useEffect(() => {
    const fetchClinics = async () => {
      setIsLoading(true);
      try {
        const data = await clinicApi.getClinics();
        setClinics(data);
        
        // Selecionar clínica baseada no role do usuário
        if (canSelectClinic) {
          // Admin_lify: selecionar primeira clínica ativa se não houver seleção anterior
          const savedClinic = localStorage.getItem('selectedClinic');
          if (savedClinic) {
            try {
              const parsedClinic = JSON.parse(savedClinic);
              const clinicExists = data.find((clinic: Clinic) => clinic.id === parsedClinic.id);
              if (clinicExists) {
                setSelectedClinic(clinicExists);
              } else {
                const firstActiveClinic = data.find((clinic: Clinic) => clinic.status === 'active');
                if (firstActiveClinic) {
                  setSelectedClinic(firstActiveClinic);
                }
              }
            } catch (error) {
              console.error('Erro ao carregar clínica salva:', error);
              const firstActiveClinic = data.find((clinic: Clinic) => clinic.status === 'active');
              if (firstActiveClinic) {
                setSelectedClinic(firstActiveClinic);
              }
            }
          } else {
            const firstActiveClinic = data.find((clinic: Clinic) => clinic.status === 'active');
            if (firstActiveClinic) {
              setSelectedClinic(firstActiveClinic);
            }
          }
        } else {
          // Usuário normal: selecionar sua própria clínica
          const userClinic = data.find((clinic: Clinic) => clinic.id === user?.clinic_id);
          if (userClinic) {
            setSelectedClinic(userClinic);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar clínicas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClinics();
  }, [canSelectClinic, user?.clinic_id]);

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
    canSelectClinic,
    availableClinics,
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
