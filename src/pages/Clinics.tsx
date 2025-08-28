import { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Phone, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import clinicService, { Clinic } from "@/services/clinicService"

export default function Clinics() {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    context: ""
  })
  const [loading, setLoading] = useState(false)

  const loadClinics = async () => {
    try {
      const list = await clinicService.getClinics(100, 0)
      // map minimal fields for UI fallback
      const mapped: Clinic[] = list
      setClinics(mapped)
    } catch {
      // keep empty
    }
  }

  useEffect(() => {
    loadClinics()
  }, [])

  const handleOpenDialog = (clinic?: any) => {
    if (clinic) {
      setEditingClinic(clinic)
      setFormData({
        name: (clinic as any).name || "",
        whatsapp: (clinic as any).whatsapp_id_number || "",
        context: ""
      })
    } else {
      setEditingClinic(null)
      setFormData({ name: "", whatsapp: "", context: "" })
    }
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      if (editingClinic) {
        const updated = await clinicService.updateClinic(editingClinic.id, { name: formData.name })
        setClinics(prev => prev.map(c => c.id === editingClinic.id ? updated : c))
      } else {
        const created = await clinicService.createClinic({ name: formData.name, whatsapp_id_number: formData.whatsapp })
        setClinics(prev => [created, ...prev])
      }
      setIsDialogOpen(false)
    } catch {
      // ignore visual
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await clinicService.deleteClinic(id)
      setClinics(clinics.filter(c => c.id !== id))
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2" disabled={loading}>
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
                  placeholder="698766983327246"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="context">JSON de Contextualização (opcional)</Label>
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
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
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
                  WhatsApp ID
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
              clinics.map((clinic: any) => (
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
                      {clinic.whatsapp_id_number || ''}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto">
                        {JSON.stringify({ mission: clinic.mission, specialties: clinic.specialties }, null, 2)}
                      </pre>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => handleOpenDialog(clinic)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(clinic.id)}>
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