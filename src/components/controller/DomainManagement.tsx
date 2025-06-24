
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

interface DomainOwner {
  id: string;
  domain: string;
  user_id: string;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
}

const DomainManagement = () => {
  const [newDomain, setNewDomain] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const queryClient = useQueryClient();

  const { data: domains = [], isLoading } = useQuery({
    queryKey: ['domain_owners'],
    queryFn: async () => {
      // Primeiro buscar todos os domain_owners
      const { data: domainOwners, error: domainError } = await supabase
        .from('domain_owners')
        .select('*')
        .order('created_at', { ascending: false });

      if (domainError) throw domainError;

      // Depois buscar os profiles correspondentes
      const userIds = domainOwners?.map(d => d.user_id) ?? [];
      
      if (userIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Combinar os dados
      const domainsWithProfiles = domainOwners?.map(domain => ({
        ...domain,
        profiles: profiles?.find(p => p.id === domain.user_id) || null
      })) ?? [];

      return domainsWithProfiles as DomainOwner[];
    }
  });

  const addDomainMutation = useMutation({
    mutationFn: async ({ domain, userEmail }: { domain: string; userEmail: string }) => {
      // Primeiro, buscar o usuário pelo email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (profileError || !profile) {
        throw new Error('Usuário não encontrado com este email');
      }

      // Inserir o domínio
      const { error } = await supabase
        .from('domain_owners')
        .insert([{ domain, user_id: profile.id }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain_owners'] });
      setNewDomain("");
      setNewUserEmail("");
      toast.success("Domínio adicionado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar domínio");
    }
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const { error } = await supabase
        .from('domain_owners')
        .delete()
        .eq('id', domainId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain_owners'] });
      toast.success("Domínio removido com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao remover domínio");
    }
  });

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim() || !newUserEmail.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    
    addDomainMutation.mutate({ 
      domain: newDomain.trim(), 
      userEmail: newUserEmail.trim() 
    });
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Domínios</h1>
        <p className="text-gray-600">Gerencie os domínios e seus proprietários</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Novo Domínio
          </CardTitle>
          <CardDescription>
            Associe um domínio a um usuário existente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddDomain} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="domain">Domínio</Label>
                <Input
                  id="domain"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="exemplo.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="userEmail">Email do Usuário</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="usuario@email.com"
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={addDomainMutation.isPending}
              className="w-full md:w-auto"
            >
              {addDomainMutation.isPending ? "Adicionando..." : "Adicionar Domínio"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Domínios Cadastrados</CardTitle>
          <CardDescription>
            Lista de todos os domínios e seus proprietários
          </CardDescription>
        </CardHeader>
        <CardContent>
          {domains.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhum domínio cadastrado ainda
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domínio</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">{domain.domain}</TableCell>
                    <TableCell>{domain.profiles?.full_name || 'Nome não informado'}</TableCell>
                    <TableCell>{domain.profiles?.email || 'Email não encontrado'}</TableCell>
                    <TableCell>
                      {new Date(domain.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteDomainMutation.mutate(domain.id)}
                        disabled={deleteDomainMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

export default DomainManagement;
