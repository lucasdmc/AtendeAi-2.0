import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Building2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { clinicService } from '@/services/clinicService';

interface Clinic {
  id: string;
  name: string;
  whatsapp_number: string;
  meta_webhook_url?: string;
  whatsapp_id?: string;
  context_json: Record<string, any>;
  simulation_mode: boolean;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

const defaultContextJSON = {
  agente_ia: {
    configuracao: {
      nome: "Dr. Virtual",
      personalidade: "Profissional e acolhedor",
      tom_comunicacao: "Formal mas amigável",
      saudacao_inicial: "Olá! Sou o assistente virtual da clínica. Como posso ajudá-lo?",
      mensagem_despedida: "Obrigado pelo contato! Tenha um ótimo dia!",
      mensagem_fora_horario: "No momento estamos fora do horário de atendimento."
    },
    comportamento: {
      proativo: true,
      oferece_sugestoes: true,
      escalacao_automatica: true,
      limite_tentativas: 3
    }
  },
  horario_funcionamento: {
    segunda: { abertura: "08:00", fechamento: "18:00" },
    terca: { abertura: "08:00", fechamento: "18:00" },
    quarta: { abertura: "08:00", fechamento: "18:00" },
    quinta: { abertura: "08:00", fechamento: "18:00" },
    sexta: { abertura: "08:00", fechamento: "18:00" },
    sabado: { abertura: "08:00", fechamento: "12:00" },
    domingo: { abertura: "00:00", fechamento: "00:00" }
  }
};

const Clinics: React.FC = () => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    whatsapp_number: '',
    meta_webhook_url: '',
    whatsapp_id: '',
    context_json: JSON.stringify(defaultContextJSON, null, 2),
    simulation_mode: false
  });

  const { toast } = useToast();
  const { isAdminLify } = useAuth();

  useEffect(() => {
    checkPermissionAndLoadClinics();
  }, []);

  const checkPermissionAndLoadClinics = async () => {
    try {
      const hasPermission = await isAdminLify();
      if (!hasPermission) {
        toast({
          title: "Acesso Negado",
          description: "Apenas Admin Lify pode gerenciar clínicas",
          variant: "destructive"
        });
        return;
      }
      await loadClinics();
    } catch (error) {
      console.error('Error checking permissions:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar permissões",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClinics = async () => {
    try {
      const response = await clinicService.list();
      setClinics(response.data);
    } catch (error) {
      console.error('Error loading clinics:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar clínicas",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate JSON
      let contextJson;
      try {
        contextJson = JSON.parse(formData.context_json);
      } catch {
        toast({
          title: "Erro",
          description: "JSON de contextualização inválido",
          variant: "destructive"
        });
        return;
      }

      const clinicData = {
        name: formData.name,
        whatsapp_number: formData.whatsapp_number,
        meta_webhook_url: formData.meta_webhook_url || undefined,
        whatsapp_id: formData.whatsapp_id || undefined,
        context_json: contextJson,
        simulation_mode: formData.simulation_mode
      };

      if (editingClinic) {
        await clinicService.update(editingClinic.id, clinicData);
        toast({
          title: "Sucesso",
          description: "Clínica atualizada com sucesso!"
        });
      } else {
        await clinicService.create(clinicData);
        toast({
          title: "Sucesso", 
          description: "Clínica criada com sucesso!"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      await loadClinics();
    } catch (error: any) {
      console.error('Error saving clinic:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao salvar clínica",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (clinic: Clinic) => {
    setEditingClinic(clinic);
    setFormData({
      name: clinic.name,
      whatsapp_number: clinic.whatsapp_number,
      meta_webhook_url: clinic.meta_webhook_url || '',
      whatsapp_id: clinic.whatsapp_id || '',
      context_json: JSON.stringify(clinic.context_json, null, 2),
      simulation_mode: clinic.simulation_mode
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (clinic: Clinic) => {
    if (!confirm(`Tem certeza que deseja remover a clínica "${clinic.name}"?`)) {
      return;
    }

    try {
      await clinicService.delete(clinic.id);
      toast({
        title: "Sucesso",
        description: "Clínica removida com sucesso!"
      });
      await loadClinics();
    } catch (error: any) {
      console.error('Error deleting clinic:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao remover clínica",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setEditingClinic(null);
    setFormData({
      name: '',
      whatsapp_number: '',
      meta_webhook_url: '',
      whatsapp_id: '',
      context_json: JSON.stringify(defaultContextJSON, null, 2),
      simulation_mode: false
    });
  };

  const loadTemplate = () => {
    setFormData(prev => ({
      ...prev,
      context_json: JSON.stringify(defaultContextJSON, null, 2)
    }));
    toast({
      title: "Template Carregado",
      description: "Template padrão carregado com sucesso!"
    });
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(JSON.stringify(defaultContextJSON, null, 2));
    toast({
      title: "Template Copiado",
      description: "Template copiado para a área de transferência!"
    });
  };

  const filteredClinics = clinics.filter(clinic =>
    clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.whatsapp_number.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando clínicas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gestão de Clínicas</h1>
            <p className="text-muted-foreground">Gerencie clínicas do sistema multiclínicas</p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Clínica
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingClinic ? 'Editar Clínica' : 'Nova Clínica'}
              </DialogTitle>
              <DialogDescription>
                {editingClinic ? 'Edite os dados da clínica' : 'Cadastre uma nova clínica no sistema'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Clínica *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Clínica São Paulo"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number">Número WhatsApp *</Label>
                  <Input
                    id="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                    placeholder="Ex: +5511999999999"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_webhook_url">Webhook URL Meta</Label>
                  <Input
                    id="meta_webhook_url"
                    value={formData.meta_webhook_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_webhook_url: e.target.value }))}
                    placeholder="https://webhook.clinica.com/whatsapp"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_id">WhatsApp ID</Label>
                  <Input
                    id="whatsapp_id"
                    value={formData.whatsapp_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_id: e.target.value }))}
                    placeholder="whatsapp_business_id"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="simulation_mode"
                  checked={formData.simulation_mode}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, simulation_mode: checked }))}
                />
                <Label htmlFor="simulation_mode">Modo de Simulação</Label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="context_json">JSON de Contextualização *</Label>
                  <div className="flex space-x-2">
                    <Button type="button" variant="outline" size="sm" onClick={loadTemplate}>
                      Carregar Template
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={copyTemplate}>
                      Copiar Template
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="context_json"
                  value={formData.context_json}
                  onChange={(e) => setFormData(prev => ({ ...prev, context_json: e.target.value }))}
                  placeholder="Cole ou edite o JSON de contextualização..."
                  className="min-h-[200px] font-mono text-sm"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingClinic ? 'Salvar Alterações' : 'Criar Clínica'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome ou WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredClinics.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'Nenhuma clínica encontrada' : 'Nenhuma clínica cadastrada'}
            </h3>
            <p className="text-muted-foreground text-center">
              {searchTerm 
                ? 'Tente ajustar os termos de busca.'
                : 'Comece criando sua primeira clínica no sistema.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClinics.map((clinic) => (
            <Card key={clinic.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{clinic.name}</span>
                      {clinic.simulation_mode && (
                        <Badge variant="secondary">Simulação</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{clinic.whatsapp_number}</CardDescription>
                  </div>
                  <Badge variant={clinic.status === 'active' ? 'default' : 'secondary'}>
                    {clinic.status === 'active' ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 text-sm">
                  {clinic.whatsapp_id && (
                    <div>
                      <span className="font-medium">WhatsApp ID:</span> {clinic.whatsapp_id}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Criada em:</span>{' '}
                    {new Date(clinic.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  <div>
                    <span className="font-medium">Última atualização:</span>{' '}
                    {new Date(clinic.updated_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(clinic)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(clinic)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clinics;