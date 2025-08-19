import { useState } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface User {
  id: string
  name: string
  email: string
  role: string
  clinic: string
}

const mockUsers: User[] = [
  {
    id: "1",
    name: "Dr. João Silva",
    email: "joao@clinica.com",
    role: "admin",
    clinic: "Clínica São José"
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria@saude.com",
    role: "operator",
    clinic: "Centro Médico Saúde+"
  }
]

export default function Users() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    clinic: ""
  })

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        clinic: user.clinic
      })
    } else {
      setEditingUser(null)
      setFormData({ name: "", email: "", role: "", clinic: "" })
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (editingUser) {
      setUsers(users.map(u => 
        u.id === editingUser.id 
          ? { ...editingUser, ...formData }
          : u
      ))
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        ...formData
      }
      setUsers([...users, newUser])
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setUsers(users.filter(u => u.id !== id))
  }

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: "Administrador",
      operator: "Operador",
      viewer: "Visualizador"
    }
    return roles[role] || role
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestão de Usuários</h2>
          <p className="text-muted-foreground">
            Gerencie os usuários do sistema
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Editar Usuário" : "Novo Usuário"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do usuário abaixo
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Digite o nome do usuário"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="usuario@email.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Perfil</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="operator">Operador</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="clinic">Clínica</Label>
                <Input
                  id="clinic"
                  value={formData.clinic}
                  onChange={(e) => setFormData({...formData, clinic: e.target.value})}
                  placeholder="Nome da clínica associada"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{user.name}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDialog(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm font-medium">Perfil:</Label>
                  <span className="text-sm">{getRoleLabel(user.role)}</span>
                </div>
                <div className="flex justify-between">
                  <Label className="text-sm font-medium">Clínica:</Label>
                  <span className="text-sm">{user.clinic}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}