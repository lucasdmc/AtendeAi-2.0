import { useState, useEffect } from "react"
import { Calendar as CalendarIcon, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function Calendar() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Verificar se já existe uma sessão ativa
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
      }
    }

    checkSession()

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user)
          if (event === 'SIGNED_IN') {
            toast({
              title: "Login realizado com sucesso!",
              description: "Você foi autenticado com sua conta Google.",
            })
          }
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [toast])

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar.readonly',
          redirectTo: `${window.location.origin}/calendar`
        }
      })

      if (error) {
        toast({
          title: "Erro ao fazer login",
          description: error.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao tentar fazer login com Google.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        title: "Erro ao fazer logout",
        description: error.message,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })
    }
  }

  if (user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            <span className="text-sm text-muted-foreground">
              Conectado como: {user.email}
            </span>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Desconectar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Google Calendar
            </CardTitle>
            <CardDescription>
              Visualização do Google Calendar será implementada aqui
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-96 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Integração com Google Calendar em desenvolvimento
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  A visualização do calendário será exibida nesta área
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CalendarIcon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Calendário Google</CardTitle>
          <CardDescription>
            Conecte-se à sua conta Google para visualizar e gerenciar seus eventos do calendário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleGoogleLogin} 
            disabled={isLoading}
            className="w-full gap-2"
          >
            <LogIn className="h-4 w-4" />
            {isLoading ? "Conectando..." : "Conectar com Google"}
          </Button>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Permissões solicitadas:</strong>
              <br />
              • Visualização de eventos do calendário
              <br />
              • Acesso às informações básicas do perfil
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}