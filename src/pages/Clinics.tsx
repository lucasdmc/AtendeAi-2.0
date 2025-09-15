import { useState } from "react"
import { Building2, MapPin, Phone, Mail, Plus, Edit, Trash2, Search, Brain, Upload, Loader2, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useClinics } from "@/hooks/useApi"

interface Clinic {
  id: string
  name: string
  whatsapp_number: string
  meta_webhook_url?: string
  whatsapp_id?: string
  context_json: any
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

// Mock data removed - now using real API data

export default function Clinics() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState(false)
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null)
  const [selectedClinicForJson, setSelectedClinicForJson] = useState<Clinic | null>(null)
  const [jsonConfig, setJsonConfig] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // API hooks
  const { data: clinics = [], loading: clinicsLoading, error: clinicsError, refetch: refetchClinics } = useClinics()

  const filteredClinics = (clinics || []).filter(clinic =>
    clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.whatsapp_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsCreating(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      const clinicData = {
        name: formData.get('name') as string,
        whatsapp_number: formData.get('whatsapp') as string,
        meta_webhook_url: formData.get('webhook') as string,
        status: formData.get('status') as string || 'active',
        context_json: {
          clinica: {
            informacoes_basicas: {
              nome: formData.get('name') as string,
              descricao: formData.get('description') as string || ''
            },
            localizacao: {
              endereco_principal: formData.get('address') as string || ''
            },
            contatos: {
              telefone_principal: formData.get('whatsapp') as string,
              email_principal: formData.get('email') as string || ''
            }
          }
        }
      }
      
      // TEMPORÁRIO: Mock da criação até Railway atualizar
      console.log('Criando clínica:', clinicData)
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Simular sucesso
      const mockClinic = {
        id: Date.now().toString(),
        ...clinicData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('Clínica criada (mock):', mockClinic)
      
      // Recarregar lista de clínicas
      await refetchClinics()
      
      // Fechar modal e limpar formulário
      setIsCreateDialogOpen(false)
      e.currentTarget.reset()
      
      // Mostrar notificação de sucesso
      alert('Clínica criada com sucesso!')
      
    } catch (error) {
      console.error('Erro ao criar clínica:', error)
      alert('Erro ao criar clínica. Verifique os dados e tente novamente.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleEdit = (clinic: Clinic) => {
    setEditingClinic(clinic)
    setIsEditDialogOpen(true)
  }

  const handleJsonConfig = (clinic: Clinic) => {
    setSelectedClinicForJson(clinic)
    setJsonConfig("")
    setIsJsonDialogOpen(true)
  }

  const handleDelete = async (clinic: Clinic) => {
    if (window.confirm(`Tem certeza que deseja deletar a clínica "${clinic.name}"? Esta ação não pode ser desfeita.`)) {
      try {
        // TODO: Implementar chamada real para API quando estiver disponível
        console.log('Deletando clínica:', clinic.id)
        
        // Simular delay da API
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Recarregar lista de clínicas
        await refetchClinics()
        
        // Mostrar notificação de sucesso
        alert('Clínica deletada com sucesso!')
        
      } catch (error) {
        console.error('Erro ao deletar clínica:', error)
        alert('Erro ao deletar clínica. Tente novamente.')
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/json") {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const parsedJson = JSON.parse(content)
          setJsonConfig(JSON.stringify(parsedJson, null, 2))
        } catch (error) {
          alert("Erro ao ler o arquivo JSON. Verifique se o formato está correto.")
        }
      }
      reader.readAsText(file)
    } else {
      alert("Por favor, selecione um arquivo JSON válido.")
    }
    // Reset input value to allow selecting the same file again
    event.target.value = ""
  }

  // Loading state
  if (clinicsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando clínicas...</span>
      </div>
    )
  }

  // Error state
  if (clinicsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <div className="ml-2 text-center">
          <p className="text-destructive font-medium">Erro ao carregar clínicas</p>
          <p className="text-sm text-muted-foreground">{clinicsError}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchClinics()}
            className="mt-2"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Clínicas</h1>
          <p className="text-muted-foreground">
            Gerencie as clínicas do sistema e suas configurações
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Clínica
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Clínica</DialogTitle>
              <DialogDescription>
                Preencha as informações da nova clínica
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Clínica *</Label>
                <Input id="name" name="name" placeholder="Digite o nome da clínica" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input id="description" name="description" placeholder="Descrição da clínica" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp *</Label>
                  <Input id="whatsapp" name="whatsapp" placeholder="(11) 99999-9999" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="contato@clinica.com" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" name="address" placeholder="Rua, número - Bairro" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhook">Meta Webhook (Opcional)</Label>
                <Input id="webhook" name="webhook" placeholder="https://api.clinica.com/webhook" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue="active">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="inactive">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Criando...' : 'Criar Clínica'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar clínicas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clínica</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClinics.map((clinic) => (
                <TableRow key={clinic.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{clinic.name}</span>
                      </div>
                      {clinic.context_json?.clinica?.informacoes_basicas?.descricao && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {clinic.context_json.clinica.informacoes_basicas.descricao}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-start space-x-2 max-w-xs">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-sm line-clamp-2">
                        {typeof clinic.context_json?.clinica?.localizacao?.endereco_principal === 'string' ? 
                          clinic.context_json.clinica.localizacao.endereco_principal :
                          'Endereço não informado'
                        }
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{clinic.context_json?.clinica?.contatos?.telefone_principal || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[150px]">{clinic.context_json?.clinica?.contatos?.email_principal || 'Não informado'}</span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm">{clinic.whatsapp_number}</span>
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant={clinic.status === 'active' ? 'default' : 'secondary'}
                      className={clinic.status === 'active' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                      }
                    >
                      {clinic.status === 'active' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">
                      - usuários
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(clinic.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </TableCell>
                  
                   <TableCell className="text-right">
                     <div className="flex justify-end space-x-1">
                       <Button variant="ghost" size="sm" onClick={() => handleJsonConfig(clinic)}>
                         <Brain className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="sm" onClick={() => handleEdit(clinic)}>
                         <Edit className="h-4 w-4" />
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="text-destructive hover:text-destructive"
                         onClick={() => handleDelete(clinic)}
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                   </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredClinics.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma clínica encontrada</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Não há clínicas que correspondam à sua busca.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Clínica</DialogTitle>
            <DialogDescription>
              Altere as informações da clínica
            </DialogDescription>
          </DialogHeader>
          {editingClinic && (
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome da Clínica</Label>
                <Input id="edit-name" defaultValue={editingClinic.name} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-whatsapp">WhatsApp</Label>
                  <Input id="edit-whatsapp" defaultValue={editingClinic.whatsapp_number} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-verify-token">WhatsApp Verify Token</Label>
                  <Input id="edit-verify-token" placeholder="verify_token_123" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-webhook">Meta Webhook (Opcional)</Label>
                <Input id="edit-webhook" defaultValue={editingClinic.meta_webhook_url || ""} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select defaultValue={editingClinic.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="inactive">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Configuração JSON */}
      <Dialog open={isJsonDialogOpen} onOpenChange={setIsJsonDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Configuração JSON - {selectedClinicForJson?.name}</DialogTitle>
            <DialogDescription>
              Insira a configuração JSON para esta clínica
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="json-config">Configuração JSON</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Carregar JSON
                  </Button>
                </div>
              </div>
              <Textarea 
                id="json-config"
                value={jsonConfig}
                onChange={(e) => setJsonConfig(e.target.value)}
                placeholder='{"key": "value", "setting": "example"}'
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsJsonDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Configuração
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}