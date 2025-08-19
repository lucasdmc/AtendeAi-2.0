import { useState } from "react"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestão de Clínicas</h2>
          <p className="text-muted-foreground">
            Gerencie as clínicas cadastradas no sistema
          </p>
        </div>
        
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clinics.map((clinic) => (
          <Card key={clinic.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{clinic.name}</span>
                <div className="flex gap-2">
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
              </CardTitle>
              <CardDescription>{clinic.whatsapp}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Contexto:</Label>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {clinic.context}
                </pre>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}