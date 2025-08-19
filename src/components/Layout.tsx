import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AppSidebar } from "./AppSidebar"
import { useState } from "react"
import { useLocation } from "react-router-dom"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [selectedClinic, setSelectedClinic] = useState("cardioprime_blumenau_2024")
  const location = useLocation()

  const getPageTitle = () => {
    const pageTitles: Record<string, string> = {
      "/": "Dashboard",
      "/clinics": "Gestão de Clínicas",
      "/users": "Gestão de Usuários", 
      "/appointments": "Agendamentos",
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
            
            <div className="w-72">
              <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cardioprime_blumenau_2024">CardioPrime - Blumenau</SelectItem>
                </SelectContent>
              </Select>
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