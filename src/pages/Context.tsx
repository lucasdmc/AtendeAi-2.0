import { useState } from "react"
import { Save, FileText, Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ContextItem {
  id: string
  title: string
  clinic: string
  category: string
  content: string
  isActive: boolean
}

const mockContexts: ContextItem[] = [
  {
    id: "1",
    title: "Horários de Funcionamento",
    clinic: "Clínica São José",
    category: "general",
    content: "Nossa clínica funciona de segunda a sexta das 8h às 18h, e aos sábados das 8h às 12h.",
    isActive: true
  },
  {
    id: "2", 
    title: "Especialidades Disponíveis",
    clinic: "Centro Médico Saúde+",
    category: "medical",
    content: "Oferecemos consultas em cardiologia, dermatologia, pediatria, ginecologia e clínica geral.",
    isActive: true
  },
  {
    id: "3",
    title: "Política de Cancelamento",
    clinic: "Clínica São José", 
    category: "policy",
    content: "Cancelamentos devem ser feitos com pelo menos 24 horas de antecedência.",
    isActive: false
  }
]

export default function Context() {
  const [contexts, setContexts] = useState<ContextItem[]>(mockContexts)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContext, setEditingContext] = useState<ContextItem | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    clinic: "",
    category: "",
    content: "",
    isActive: true
  })

  const handleOpenDialog = (context?: ContextItem) => {
    if (context) {
      setEditingContext(context)
      setFormData({
        title: context.title,
        clinic: context.clinic,
        category: context.category,
        content: context.content,
        isActive: context.isActive
      })
    } else {
      setEditingContext(null)
      setFormData({ title: "", clinic: "", category: "", content: "", isActive: true })
    }
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (editingContext) {
      setContexts(contexts.map(c => 
        c.id === editingContext.id 
          ? { ...editingContext, ...formData }
          : c
      ))
    } else {
      const newContext: ContextItem = {
        id: Date.now().toString(),
        ...formData
      }
      setContexts([...contexts, newContext])
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setContexts(contexts.filter(c => c.id !== id))
  }

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      general: "Geral",
      medical: "Médico",
      policy: "Política",
      schedule: "Agendamento"
    }
    return categories[category] || category
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestão de Contexto</h2>
          <p className="text-muted-foreground">
            Gerencie as informações contextuais para o atendente virtual
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Contexto
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingContext ? "Editar Contexto" : "Novo Contexto"}
              </DialogTitle>
              <DialogDescription>
                Defina as informações que o chatbot deve conhecer
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Título do contexto"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clinic">Clínica</Label>
                  <Input
                    id="clinic"
                    value={formData.clinic}
                    onChange={(e) => setFormData({...formData, clinic: e.target.value})}
                    placeholder="Nome da clínica"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Geral</SelectItem>
                    <SelectItem value="medical">Médico</SelectItem>
                    <SelectItem value="policy">Política</SelectItem>
                    <SelectItem value="schedule">Agendamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Descreva a informação que o chatbot deve conhecer..."
                  className="min-h-[120px]"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {contexts.map((context) => (
          <Card key={context.id} className={`hover:shadow-md transition-shadow ${!context.isActive ? 'opacity-60' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span>{context.title}</span>
                  {!context.isActive && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                      Inativo
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDialog(context)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(context.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription className="flex items-center gap-4">
                <span>{context.clinic}</span>
                <span className="bg-muted px-2 py-1 rounded text-xs">
                  {getCategoryLabel(context.category)}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">
                {context.content}
              </p>
            </CardContent>
          </Card>
        ))}
        
        {contexts.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum contexto cadastrado ainda.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}