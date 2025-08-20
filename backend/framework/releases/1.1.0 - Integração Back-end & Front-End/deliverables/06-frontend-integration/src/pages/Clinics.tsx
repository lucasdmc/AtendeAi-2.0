import { useState } from "react"
import { Plus, Edit, Trash2, Phone, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Clinic {
  id: string
  name: string
  whatsapp: string
  context: string
}

const mockClinics: Clinic[] = [
  {
    id: "1",
    name: "Clínica São José",
    whatsapp: "+55 11 99999-9999",
    context: '{"specialties": ["cardiologia", "dermatologia"], "schedule": "8h-18h"}'
  },
  {
    id: "2", 
    name: "Centro Médico Saúde+",
    whatsapp: "+55 11 88888-8888",
    context: '{"specialties": ["pediatria", "ginecologia"], "schedule": "7h-19h"}'
  }
]

export default function Clinics() {
  const [clinics, setClinics] = useState<Clinic[]>(mockClinics)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    context: ""
  })

  const handleOpenDialog = (clinic?: Clinic) => {
    if (clinic) {
      setEditingClinic(clinic)
      setFormData({
        name: clinic.name,
        whatsapp: clinic.whatsapp,
        context: clinic.context
      })
    } else {
      setEditingClinic(null)
      setFormData({ name: "", whatsapp: "", context: "" })
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (editingClinic) {
      setClinics(clinics.map(c => 
        c.id === editingClinic.id 
          ? { ...editingClinic, ...formData }
          : c
      ))
    } else {
      const newClinic: Clinic = {
        id: Date.now().toString(),
        ...formData
      }
      setClinics([...clinics, newClinic])
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setClinics(clinics.filter(c => c.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Clínica
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingClinic ? "Editar Clínica" : "Nova Clínica"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados da clínica abaixo
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Clínica</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Digite o nome da clínica"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="whatsapp">Número do WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                  placeholder="+55 11 99999-9999"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="context">JSON de Contextualização</Label>
                <Textarea
                  id="context"
                  value={formData.context}
                  onChange={(e) => setFormData({...formData, context: e.target.value})}
                  placeholder='{"specialties": ["cardiologia"], "schedule": "8h-18h"}'
                  className="min-h-[100px] font-mono text-sm"
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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Nome da Clínica
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  WhatsApp
                </div>
              </TableHead>
              <TableHead>Contexto</TableHead>
              <TableHead className="text-right w-[140px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clinics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Nenhuma clínica cadastrada
                </TableCell>
              </TableRow>
            ) : (
              clinics.map((clinic) => (
                <TableRow key={clinic.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      {clinic.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {clinic.whatsapp}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto">
                        {clinic.context}
                      </pre>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDialog(clinic)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(clinic.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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