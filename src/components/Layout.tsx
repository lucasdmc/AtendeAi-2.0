import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "./AppSidebar"
import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { LogOut, User } from "lucide-react"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [selectedClinic, setSelectedClinic] = useState("cardioprime_blumenau_2024")
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut, loading } = useAuth()

  // Desabilitado durante desenvolvimento
  // useEffect(() => {
  //   console.log('🔧 Layout useEffect - loading:', loading, 'user:', user)
  //   if (!loading && !user) {
  //     console.log('🔧 Redirecting to /auth')
  //     navigate("/auth")
  //   }
  // }, [loading, user, navigate])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null
  }

  const handleLogout = async () => {
    await signOut()
    navigate("/auth")
  }

  const getPageTitle = () => {
    const pageTitles: Record<string, string> = {
      "/": "Dashboard",
      "/clinics": "Gestão de Clínicas",
      "/users": "Gestão de Usuários", 
      "/appointments": "Agendamentos",
      "/calendar": "Calendário",
      "/context": "Contexto",
      "/conversations": "Conversas"
    }
    return pageTitles[location.pathname] || "Sistema de Gestão"
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 flex items-center justify-between px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-foreground">
                {getPageTitle()}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                <SelectTrigger className="w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cardioprime_blumenau_2024">CardioPrime - Blumenau</SelectItem>
                </SelectContent>
              </Select>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}