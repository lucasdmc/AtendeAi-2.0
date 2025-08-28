import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, User, Mail, Shield, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import userService, { AppUserDTO } from "@/services/userService"

export default function Users() {
  const [users, setUsers] = useState<AppUserDTO[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUserDTO | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    clinic: ""
  })

  useEffect(() => {
    const load = async () => {
      try {
        const clinicId = import.meta.env.VITE_DEFAULT_CLINIC_ID as string
        const list = await userService.list(clinicId)
        setUsers(list)
      } catch {
        // keep empty
      }
    }
    load()
  }, [])

  const handleOpenDialog = (user?: AppUserDTO) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        clinic: user.clinic_id
      })
    } else {
      setEditingUser(null)
      setFormData({ name: "", email: "", role: "", clinic: "" })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingUser) {
        const updated = await userService.update(editingUser.id, { name: formData.name, role: formData.role })
        setUsers(prev => prev.map(u => u.id === editingUser.id ? updated : u))
      } else {
        const created = await userService.create({ name: formData.name, email: formData.email, role: formData.role, clinic_id: formData.clinic })
        setUsers(prev => [created, ...prev])
      }
      setIsDialogOpen(false)
    } catch {
      // ignore
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await userService.remove(id)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch {
      // ignore
    }
  }

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin_lify: "Admin Lify",
      admin_clinic: "Admin Clínica",
      attendant: "Atendente",
    }
    return roles[role] || role
  }

  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "admin_lify":
        return "default"
      case "admin_clinic":
        return "secondary"
      case "attendant":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
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
                <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Digite o nome do usuário" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="usuario@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Perfil</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_lify">Admin Lify</SelectItem>
                    <SelectItem value="admin_clinic">Admin Clínica</SelectItem>
                    <SelectItem value="attendant">Atendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinic">Clínica</Label>
                <Input id="clinic" value={formData.clinic} onChange={(e) => setFormData({...formData, clinic: e.target.value})} placeholder="UUID da clínica" />
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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]"><div className="flex items-center gap-2"><User className="h-4 w-4" />Nome</div></TableHead>
              <TableHead><div className="flex items-center gap-2"><Mail className="h-4 w-4" />E-mail</div></TableHead>
              <TableHead><div className="flex items-center gap-2"><Shield className="h-4 w-4" />Perfil</div></TableHead>
              <TableHead><div className="flex items-center gap-2"><Building2 className="h-4 w-4" />Clínica</div></TableHead>
              <TableHead className="text-right w-[140px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhum usuário cadastrado</TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      {user.name}
                    </div>
                  </TableCell>
                  <TableCell><div className="text-sm text-muted-foreground">{user.email}</div></TableCell>
                  <TableCell><Badge variant={getRoleBadgeVariant(user.role)}>{getRoleLabel(user.role)}</Badge></TableCell>
                  <TableCell><div className="text-sm">{user.clinic_id}</div></TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => handleOpenDialog(user)}><Edit className="h-4 w-4" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}