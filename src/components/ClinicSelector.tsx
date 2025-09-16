import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClinic } from '@/contexts/ClinicContext';
import { useAuth } from '@/hooks/useAuth';
import { Building2 } from 'lucide-react';

export const ClinicSelector: React.FC = () => {
  const { selectedClinic, setSelectedClinic, canSelectClinic, availableClinics } = useClinic();

  // Debug logs
  console.log('🔍 ClinicSelector Debug:', {
    canSelectClinic,
    availableClinicsCount: availableClinics.length,
    selectedClinic: selectedClinic ? { id: selectedClinic.id, name: selectedClinic.name } : null,
    availableClinics: availableClinics.map(c => ({ id: c.id, name: c.name }))
  });

  // Só mostrar se o usuário pode selecionar clínica
  if (!canSelectClinic) {
    console.log('🚫 ClinicSelector não renderizado: canSelectClinic = false');
    return null;
  }

  const handleClinicChange = (clinicId: string) => {
    const clinic = availableClinics.find(c => c.id === clinicId);
    if (clinic) {
      setSelectedClinic(clinic);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedClinic?.id || ''} onValueChange={handleClinicChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecionar clínica" />
        </SelectTrigger>
        <SelectContent>
          {availableClinics.map((clinic) => (
            <SelectItem key={clinic.id} value={clinic.id}>
              <div className="flex flex-col">
                <span className="font-medium">{clinic.name}</span>
                <span className="text-xs text-muted-foreground">
                  {clinic.whatsapp_id_number || clinic.whatsapp_number || 'Sem WhatsApp'}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

