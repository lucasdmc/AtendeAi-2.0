import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn } from "lucide-react";
import { authApi } from "@/services/api";

const CustomAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("lucas@lify.com");
  const [password, setPassword] = useState("lucas123");
  const [clinicId, setClinicId] = useState("cf0b8ee4-b5ca-4f9d-a7bc-0cf9df8447c1");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔐 Tentando login com:', { email, clinicId });
      
      const response = await authApi.login(email, password, clinicId);
      
      if (response.success) {
        // Salvar token e dados do usuário
        localStorage.setItem('auth_token', response.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('selectedClinic', JSON.stringify({ id: clinicId }));
        
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${response.data.user.firstName} ${response.data.user.lastName}`,
        });

        console.log('✅ Login bem-sucedido:', response.data.user);
        
        // Redirecionar para dashboard
        navigate("/");
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            AtendeAI 2.0
          </CardTitle>
          <CardDescription className="text-center">
            Sistema de Autenticação Customizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="lucas@lify.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="lucas123"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clinicId">Clinic ID</Label>
              <Input
                id="clinicId"
                type="text"
                value={clinicId}
                onChange={(e) => setClinicId(e.target.value)}
                placeholder="cf0b8ee4-b5ca-4f9d-a7bc-0cf9df8447c1"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Credenciais de teste:</strong><br/>
              Email: lucas@lify.com<br/>
              Senha: lucas123<br/>
              Clinic ID: cf0b8ee4-b5ca-4f9d-a7bc-0cf9df8447c1
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomAuth;
