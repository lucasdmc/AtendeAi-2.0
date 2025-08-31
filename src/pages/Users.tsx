import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Users as UsersIcon, Shield, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/userService';
import { clinicService } from '@/services/clinicService';

interface User {
  id: string;
  name: string;
  login: string;
  role: 'admin_lify' | 'suporte_lify' | 'atendente' | 'gestor' | 'administrador';
  clinic_id: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  clinic?: {
    id: string;
    name: string;
  };
}

interface Clinic {
  id: string;
  name: string;
}

const roleLabels = {
  admin_lify: 'Admin Lify',
  suporte_lify: 'Suporte Lify',
  administrador: 'Administrador',
  gestor: 'Gestor',
  atendente: 'Atendente'
};

const roleDescriptions = {
  admin_lify: 'Acesso total ao sistema',
  suporte_lify: 'Acesso total exceto criar clínicas',
  administrador: 'Gestão completa da clínica',
  gestor: 'Operações + contextualização',
  atendente: 'Operações básicas'
};

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    login: '',
    password: '',
    role: '',
    clinic_id: '',
    status: 'active'
  });

  const { toast } = useToast();
  const { user: currentUser, canManageUsers, isAdminLify } = useAuth();

  useEffect(() => {
    checkPermissionAndLoadData();
  }, []);

  const checkPermissionAndLoadData = async () => {
    try {
      const hasPermission = await canManageUsers();
      if (!hasPermission) {
        toast({
          title: "Acesso Negado",
          description: "Você não tem permissão para gerenciar usuários",
          variant: "destructive"
        });
        return;
      }

      await Promise.all([loadUsers(), loadClinics()]);
    } catch (error) {
      console.error('Error checking permissions:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar permissões",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userService.list();
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive"
      });
    }
  };

  const loadClinics = async () => {
    try {
      const isAdmin = await isAdminLify();
      if (isAdmin) {
        // Admin Lify can see all clinics
        const response = await clinicService.list();
        setClinics(response.data);
      } else {
        // Other users only see their own clinic
        if (currentUser?.clinic_id) {
          const clinic = await clinicService.getById(currentUser.clinic_id);
          setClinics([clinic]);
        }
      }
    } catch (error) {
      console.error('Error loading clinics:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar clínicas",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validation
      if (!formData.name || !formData.login || !formData.role) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        });
        return;
      }

      if (!editingUser && !formData.password) {
        toast({
          title: "Erro",
          description: "Senha é obrigatória para novos usuários",
          variant: "destructive"
        });
        return;
      }

      if (formData.password && formData.password.length < 6) {
        toast({
          title: "Erro",
          description: "Senha deve ter pelo menos 6 caracteres",
          variant: "destructive"
        });
        return;
      }

      // Determine clinic_id
      let clinicId = formData.clinic_id;
      if (!clinicId && currentUser?.clinic_id) {
        clinicId = currentUser.clinic_id;
      }

      const userData: any = {
        name: formData.name,
        login: formData.login,
        role: formData.role,
        clinic_id: clinicId,
        status: formData.status
      };

      if (formData.password) {
        userData.password = formData.password;
      }

      if (editingUser) {
        await userService.update(editingUser.id, userData);
        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso!"
        });
      } else {
        await userService.create(userData);
        toast({
          title: "Sucesso",
          description: "Usuário criado com sucesso!"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      await loadUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao salvar usuário",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      login: user.login,
      password: '',
      role: user.role,
      clinic_id: user.clinic_id,
      status: user.status
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) {
      toast({
        title: "Erro",
        description: "Você não pode remover seu próprio usuário",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Tem certeza que deseja remover o usuário "${user.name}"?`)) {
      return;
    }

    try {
      await userService.delete(user.id);
      toast({
        title: "Sucesso",
        description: "Usuário removido com sucesso!"
      });
      await loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.detail || "Erro ao remover usuário",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      login: '',
      password: '',
      role: '',
      clinic_id: '',
      status: 'active'
    });
    setShowPassword(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin_lify':
        return 'bg-red-100 text-red-800';
      case 'suporte_lify':
        return 'bg-orange-100 text-orange-800';
      case 'administrador':
        return 'bg-blue-100 text-blue-800';
      case 'gestor':
        return 'bg-green-100 text-green-800';
      case 'atendente':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.login.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = !statusFilter || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <UsersIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
            <p className="text-muted-foreground">Gerencie usuários do sistema</p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
              <DialogDescription>
                {editingUser ? 'Edite os dados do usuário' : 'Cadastre um novo usuário no sistema'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome completo"
                  maxLength={30}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="login">Login (Email) *</Label>
                <Input
                  id="login"
                  type="email"
                  value={formData.login}
                  onChange={(e) => setFormData(prev => ({ ...prev, login: e.target.value }))}
                  placeholder="usuario@clinica.com"
                  maxLength={25}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {editingUser ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                    maxLength={25}
                    required={!editingUser}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Perfil *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex flex-col">
                          <span>{label}</span>
                          <span className="text-xs text-muted-foreground">
                            {roleDescriptions[value as keyof typeof roleDescriptions]}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {clinics.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="clinic_id">Clínica *</Label>
                  <Select value={formData.clinic_id} onValueChange={(value) => setFormData(prev => ({ ...prev, clinic_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a clínica" />
                    </SelectTrigger>
                    <SelectContent>
                      {clinics.map((clinic) => (
                        <SelectItem key={clinic.id} value={clinic.id}>
                          {clinic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome ou login..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os perfis</SelectItem>
            {Object.entries(roleLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || roleFilter || statusFilter ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
            </h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || roleFilter || statusFilter
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando seu primeiro usuário no sistema.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{user.name}</span>
                      {user.id === currentUser?.id && (
                        <Badge variant="outline">Você</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{user.login}</CardDescription>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                      {user.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge className={getRoleColor(user.role)}>
                      {roleLabels[user.role]}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Clínica:</span>{' '}
                    {user.clinic?.name || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Criado em:</span>{' '}
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  <div>
                    <span className="font-medium">Última atualização:</span>{' '}
                    {new Date(user.updated_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  {user.id !== currentUser?.id && (
                    <Button variant="outline" size="sm" onClick={() => handleDelete(user)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;