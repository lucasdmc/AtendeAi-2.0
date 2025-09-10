import { useState } from "react"
import { Building2, MapPin, Phone, Mail, Plus, Edit, Trash2, Search, Settings } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Clinic {
  id: string
  name: string
  address: string
  phone: string
  email: string
  whatsappNumber: string
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

  const filteredClinics = clinics.filter(clinic =>
    clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    clinic.address.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Clínica</Label>
                  <Input id="name" placeholder="Digite o nome da clínica" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" placeholder="(11) 1234-5678" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" placeholder="Endereço completo da clínica" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" placeholder="contato@clinica.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" placeholder="(11) 99999-9999" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhook">Meta Webhook (Opcional)</Label>
                <Input id="webhook" placeholder="https://api.clinica.com/webhook" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" placeholder="Descrição da clínica" />
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredClinics.map((clinic) => (
          <Card key={clinic.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg">{clinic.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={clinic.status === 'active' ? 'default' : 'secondary'}
                    className={clinic.status === 'active' 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                    }
                  >
                    {clinic.status === 'active' ? 'Ativa' : 'Inativa'}
                  </Badge>
                  <Badge variant="outline">
                    {clinic.usersCount} usuários
                  </Badge>
                </div>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </CardHeader>
            
            <CardContent className="space-y-4">
              {clinic.description && (
                <p className="text-sm text-muted-foreground">
                  {clinic.description}
                </p>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{clinic.address}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{clinic.phone}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{clinic.email}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-xs text-muted-foreground">
                  Criada em {new Date(clinic.createdAt).toLocaleDateString('pt-BR')}
                </span>
                
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
    </div>
  )
}