
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import UserCreation from "./UserCreation";

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
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['active_users'],
    queryFn: async () => {
      console.log('Buscando usuários...');
      
      // Primeiro buscar todos os usuários - sem filtro de user_id já que somos admin
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Erro ao buscar profiles:', profilesError);
        throw profilesError;
      }

      console.log('Profiles encontrados:', profiles);

      // Depois buscar todos os domínios
      const { data: domainOwners, error: domainError } = await supabase
        .from('domain_owners')
        .select('user_id, domain');

      if (domainError) {
        console.error('Erro ao buscar domain_owners:', domainError);
        throw domainError;
      }

      console.log('Domain owners encontrados:', domainOwners);

      // Combinar os dados
      const usersWithDomains = profiles?.map(profile => ({
        ...profile,
        domain_owners: domainOwners?.filter(d => d.user_id === profile.id).map(d => ({ domain: d.domain })) || []
      })) ?? [];

      console.log('Usuários com domínios:', usersWithDomains);

      return usersWithDomains as UserProfile[];
    }
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
          {error && (
            <div className="text-red-600 p-4 bg-red-50 rounded-md mb-4">
              Erro ao carregar usuários: {error.message}
            </div>
          )}
          {users.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhum usuário encontrado
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
