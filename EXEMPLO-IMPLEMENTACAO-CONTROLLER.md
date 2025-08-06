# 🎯 EXEMPLO DE IMPLEMENTAÇÃO - CONTROLLER

## 📱 COMPONENTE PRINCIPAL DO CONTROLLER

### 1️⃣ ControllerDashboard.tsx
```tsx
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Globe, BarChart3 } from 'lucide-react';
import UserManagement from './UserManagement';
import DomainManagement from './DomainManagement';
import SystemStats from './SystemStats';

const ControllerDashboard = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Painel Controller</h1>
        <p className="text-gray-600 mt-2">
          Gerencie usuários, domínios e visualize estatísticas do sistema
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="domains" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Domínios
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="domains">
          <DomainManagement />
        </TabsContent>

        <TabsContent value="stats">
          <SystemStats />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ControllerDashboard;
```

### 2️⃣ UserManagement.tsx
```tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUserManagement } from '@/hooks/useUserManagement';

const UserManagement = () => {
  const { users, loading, fetchUsers, createUser, updateUser, deleteUser } = useUserManagement();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    domain: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
        setEditingUser(null);
      } else {
        await createUser(formData);
      }
      
      setIsCreateModalOpen(false);
      setFormData({ email: '', password: '', domain: '', role: 'user' });
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      domain: user.domain,
      role: user.role
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (userId: string) => {
    if (confirm('Tem certeza que deseja deletar este usuário?')) {
      await deleteUser(userId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
          <p className="text-gray-600">Gerencie todos os usuários do sistema</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
              <DialogDescription>
                {editingUser ? 'Edite as informações do usuário' : 'Cadastre um novo usuário no sistema'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              
              {!editingUser && (
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="domain">Domínio</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="cliente.catalofacil.com.br"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="role">Tipo de Usuário</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Cliente</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingUser(null);
                    setFormData({ email: '', password: '', domain: '', role: 'user' });
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingUser ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            {users.length} usuário(s) cadastrado(s) no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Domínio</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                      {user.role === 'admin' ? 'Administrador' : 'Cliente'}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.domain}</TableCell>
                  <TableCell>{user.store_name}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
```

### 3️⃣ SystemStats.tsx
```tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Globe, Store } from 'lucide-react';
import { useSystemStats } from '@/hooks/useSystemStats';

const SystemStats = () => {
  const { stats, loading, fetchStats } = useSystemStats();

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Nenhuma estatística disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Estatísticas do Sistema</h2>
        <p className="text-gray-600">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users}</div>
            <p className="text-xs text-muted-foreground">
              Usuários cadastrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_admins}</div>
            <p className="text-xs text-muted-foreground">
              Usuários com permissão de admin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domínios</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_domains}</div>
            <p className="text-xs text-muted-foreground">
              Domínios configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lojas</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_stores}</div>
            <p className="text-xs text-muted-foreground">
              Lojas ativas no sistema
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemStats;
```

### 4️⃣ Hook useUserManagement.ts
```typescript
import { useState, useEffect } from 'react';
import api from '@/services/api';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  domain: string;
  store_name: string;
  store_slug: string;
}

interface UserFormData {
  email: string;
  password: string;
  domain: string;
  role: 'admin' | 'user';
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin-management/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: UserFormData) => {
    try {
      const response = await api.post('/api/admin-management/users', userData);
      await fetchUsers(); // Recarregar lista
      toast.success('Usuário criado com sucesso!');
      return response.data;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast.error('Erro ao criar usuário');
      throw error;
    }
  };

  const updateUser = async (userId: string, userData: Partial<UserFormData>) => {
    try {
      const response = await api.put(`/api/admin-management/users/${userId}`, userData);
      await fetchUsers(); // Recarregar lista
      toast.success('Usuário atualizado com sucesso!');
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await api.delete(`/api/admin-management/users/${userId}`);
      await fetchUsers(); // Recarregar lista
      toast.success('Usuário deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast.error('Erro ao deletar usuário');
      throw error;
    }
  };

  return { users, loading, fetchUsers, createUser, updateUser, deleteUser };
};
```

## 🚀 COMO IMPLEMENTAR

1. **Crie os arquivos** seguindo a estrutura sugerida
2. **Copie os códigos** dos componentes
3. **Ajuste os imports** conforme sua estrutura de pastas
4. **Teste as funcionalidades** usando as APIs do backend
5. **Personalize o design** conforme necessário

**Todas as APIs estão prontas e funcionando!** 🎉 