import { Building2, Users, Calendar, FileText, MessageSquare, LogIn, LogOut } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

const Index = () => {
  const { user, signOut, loading } = useAuth()
  const modules = [
    {
      title: "Gestão de Clínicas",
      description: "Cadastre e gerencie as clínicas do sistema",
      icon: Building2,
      href: "/clinics",
      color: "text-blue-600"
    },
    {
      title: "Gestão de Usuários", 
      description: "Controle os usuários e suas permissões",
      icon: Users,
      href: "/users",
      color: "text-green-600"
    },
    {
      title: "Agendamentos",
      description: "Visualize e acompanhe os agendamentos",
      icon: Calendar,
      href: "/appointments", 
      color: "text-purple-600"
    },
    {
      title: "Contexto",
      description: "Configure as informações do chatbot",
      icon: FileText,
      href: "/context",
      color: "text-orange-600"
    },
    {
      title: "Conversas",
      description: "Monitore as conversas do atendimento",
      icon: MessageSquare,
      href: "/conversations",
      color: "text-pink-600"
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Sistema de Gestão de Atendimento Virtual
        </h1>
        <p className="text-lg text-muted-foreground">
          Gerencie seu chatbot para clínicas médicas de forma simples e eficiente
        </p>
        {user && (
          <div className="mt-4 flex items-center justify-center gap-4">
            <p className="text-sm text-muted-foreground">
              Bem-vindo, {user.email}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={signOut}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        )}
        {!user && (
          <div className="mt-4">
            <Link to="/auth">
              <Button className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Fazer Login
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Link key={module.href} to={module.href}>
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer h-full">
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto w-12 h-12 ${module.color} mb-4`}>
                  <module.icon className="w-full h-full" />
                </div>
                <CardTitle className="text-xl">{module.title}</CardTitle>
                <CardDescription className="text-sm">
                  {module.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-center">
                  <span className="text-sm text-primary hover:underline">
                    Acessar módulo →
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Index;
