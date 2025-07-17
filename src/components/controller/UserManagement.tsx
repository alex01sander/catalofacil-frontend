
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Edit } from "lucide-react";
import UserCreation from "./UserCreation";
import EditUserModal from "./EditUserModal";
import { API_URL } from "@/constants/api";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  domain_owners: {
    domain: string;
  }[];
}

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['active_users'],
    queryFn: async () => {
      // Buscar todos os profiles do backend
      const profilesRes = await axios.get(`${API_URL}/profiles`);
      const profiles = profilesRes.data;
      // Buscar todos os domínios do backend
      const domainsRes = await axios.get(`${API_URL}/domainOwners`);
      const domainOwners = domainsRes.data;
      // Combinar os dados
      const usersWithDomains = profiles?.map((profile: any) => ({
        ...profile,
        domain_owners: domainOwners?.filter((d: any) => d.user_id === profile.id).map((d: any) => ({ domain: d.domain })) || []
      })) ?? [];
      return usersWithDomains as UserProfile[];
    }
  });

  // Filtrar usuários por busca
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return user.full_name?.toLowerCase().includes(searchLower) ||
           user.email.toLowerCase().includes(searchLower) ||
           user.domain_owners.some(domain => domain.domain.toLowerCase().includes(searchLower));
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    console.error('Erro na query de usuários:', error);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
        <p className="text-gray-600">Crie novos usuários e visualize todos os usuários cadastrados no sistema</p>
      </div>

      <UserCreation />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Com Domínio</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(user => user.domain_owners.length > 0).length}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sem Domínio</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(user => user.domain_owners.length === 0).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Todos os usuários registrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Busca */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, email ou domínio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 p-4 bg-red-50 rounded-md mb-4">
              Erro ao carregar usuários: {error.message}
            </div>
          )}
          {filteredUsers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {users.length === 0 ? "Nenhum usuário encontrado" : "Nenhum usuário encontrado com o termo de busca"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Domínios</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name || 'Nome não informado'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.domain_owners.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.domain_owners.map((domain, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {domain.domain}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Sem domínio
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.domain_owners.length > 0 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {user.domain_owners.length > 0 ? "Ativo" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <EditUserModal
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
      />
    </div>
  );
};

export default UserManagement;
