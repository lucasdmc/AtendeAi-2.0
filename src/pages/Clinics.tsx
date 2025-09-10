import { useState } from "react"
import { Building2, MapPin, Phone, Mail, Plus, Edit, Trash2, Search, Brain } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Clinic {
  id: string
  name: string
  address: string
  phone: string
  email: string
  whatsappNumber: string
  whatsappVerifyToken?: string
  metaWebhook?: string
  status: 'active' | 'inactive'
  usersCount: number
  description?: string
  createdAt: string
}

const mockClinics: Clinic[] = [
  {
    id: "1",
    name: "Clínica Saúde Total",
    address: "Rua das Flores, 123 - Centro, São Paulo - SP",
    phone: "(11) 3333-4444",
    email: "contato@saudetotal.com.br",
    whatsappNumber: "(11) 99999-1234",
    metaWebhook: "https://api.clinic1.com/webhook",
    status: "active",
    usersCount: 15,
    description: "Clínica especializada em medicina geral e preventiva",
    createdAt: "2024-01-15"
  },
  {
    id: "2", 
    name: "Centro Médico Bem Estar",
    address: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP",
    phone: "(11) 2222-3333",
    email: "recepcao@bemestar.com.br",
    whatsappNumber: "(11) 88888-5678",
    status: "active",
    usersCount: 8,
    description: "Especialidades médicas e exames diagnósticos",
    createdAt: "2024-02-10"
  },
  {
    id: "3",
    name: "Clínica Nova Vida",
    address: "Rua da Esperança, 456 - Vila Madalena, São Paulo - SP", 
    phone: "(11) 1111-2222",
    email: "info@novavida.com.br",
    whatsappNumber: "(11) 77777-9012",
    status: "inactive",
    usersCount: 3,
    createdAt: "2024-03-01"
  }
]

export default function Clinics() {
  const [clinics, setClinics] = useState<Clinic[]>(mockClinics)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState(false)
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null)
  const [selectedClinicForJson, setSelectedClinicForJson] = useState<Clinic | null>(null)

  const filteredClinics = clinics.filter(clinic =>
    clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (clinic: Clinic) => {
    setEditingClinic(clinic)
    setIsEditDialogOpen(true)
  }

  const handleJsonConfig = (clinic: Clinic) => {
    setSelectedClinicForJson(clinic)
    setIsJsonDialogOpen(true)
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
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Clínica</Label>
                <Input id="name" placeholder="Digite o nome da clínica" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" placeholder="(11) 99999-9999" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verify-token">WhatsApp Verify Token</Label>
                  <Input id="verify-token" placeholder="verify_token_123" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhook">Meta Webhook (Opcional)</Label>
                <Input id="webhook" placeholder="https://api.clinica.com/webhook" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue="active">
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
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  Criar Clínica
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
                      {clinic.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {clinic.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-start space-x-2 max-w-xs">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-sm line-clamp-2">{clinic.address}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{clinic.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate max-w-[150px]">{clinic.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm">{clinic.whatsappNumber}</span>
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
                      {clinic.usersCount} usuários
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(clinic.createdAt).toLocaleDateString('pt-BR')}
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
                       <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
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
                  <Input id="edit-whatsapp" defaultValue={editingClinic.whatsappNumber} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-verify-token">WhatsApp Verify Token</Label>
                  <Input id="edit-verify-token" placeholder="verify_token_123" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-webhook">Meta Webhook (Opcional)</Label>
                <Input id="edit-webhook" defaultValue={editingClinic.metaWebhook || ""} />
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
              <Label htmlFor="json-config">Configuração JSON</Label>
              <Textarea 
                id="json-config"
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