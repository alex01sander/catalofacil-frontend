
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

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
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['active_users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          domain_owners(domain)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as UserProfile[];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usuários Ativos</h1>
        <p className="text-gray-600">Visualize todos os usuários cadastrados no sistema</p>
      </div>

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
