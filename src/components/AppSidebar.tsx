import { Building2, Users, Calendar as CalendarIcon, MessageSquare, FileText, Home } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"

const items = [
  { title: "Dashboard", url: "/", icon: Home, roles: ["admin_lify", "admin_clinic", "attendant"] },
  { title: "Gestão de Clínicas", url: "/clinics", icon: Building2, roles: ["admin_lify"] },
  { title: "Gestão de Usuários", url: "/users", icon: Users, roles: ["admin_lify", "admin_clinic"] },
  { title: "Agendamentos", url: "/appointments", icon: CalendarIcon, roles: ["admin_lify", "admin_clinic", "attendant"] },
  { title: "Calendário", url: "/calendar", icon: CalendarIcon, roles: ["admin_lify", "admin_clinic", "attendant"] },
  { title: "Contexto", url: "/context", icon: FileText, roles: ["admin_lify", "admin_clinic", "attendant"] },
  { title: "Conversas", url: "/conversations", icon: MessageSquare, roles: ["admin_lify", "admin_clinic", "attendant"] },
]

export function AppSidebar() {
  const { open } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const { hasAnyRole } = useAuth()

  const isActive = (path: string) => currentPath === path
  const isExpanded = items.some((i) => isActive(i.url))
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50"

  return (
    <Sidebar className={open ? "w-60" : "w-14"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-primary font-semibold">
            Atendei Aí - Atendente Virtual
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.filter(item => hasAnyRole(item.roles)).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarTrigger />
      </SidebarFooter>
    </Sidebar>
  )
}