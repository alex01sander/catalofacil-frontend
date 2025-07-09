
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Plus, Edit, Search } from "lucide-react";
import EditDomainModal from "./EditDomainModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

interface DomainOwner {
  id: string;
  domain: string;
  domain_type: string;
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
  const [newDomainType, setNewDomainType] = useState<"domain" | "subdomain">("domain");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "domain" | "subdomain">("all");
  const [editingDomain, setEditingDomain] = useState<DomainOwner | null>(null);
  const [deletingDomain, setDeletingDomain] = useState<DomainOwner | null>(null);
  const queryClient = useQueryClient();

  // Buscar todos os usuários para o select
  const { data: users = [] } = useQuery({
    queryKey: ['all_users_for_domain'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('email');
      
      if (error) throw error;
      return data;
    }
  });

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
    mutationFn: async ({ domain, userEmail, domainType }: { 
      domain: string; 
      userEmail: string; 
      domainType: "domain" | "subdomain" 
    }) => {
      // Validar formato do domínio
      const domainRegex = domainType === 'subdomain' 
        ? /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?){2,}$/
        : /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
      
      if (!domainRegex.test(domain.toLowerCase())) {
        throw new Error(`Formato inválido para ${domainType === 'subdomain' ? 'subdomínio' : 'domínio'}`);
      }

      // Verificar se já existe
      const { data: existingDomain, error: checkError } = await supabase
        .from('domain_owners')
        .select('id')
        .eq('domain', domain.toLowerCase())
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingDomain) {
        throw new Error('Este domínio já está cadastrado');
      }

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
        .insert([{ domain: domain.toLowerCase(), user_id: profile.id, domain_type: domainType }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain_owners'] });
      setNewDomain("");
      setNewUserEmail("");
      setNewDomainType("domain");
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
      userEmail: newUserEmail.trim(),
      domainType: newDomainType
    });
  };

  const handleDeleteDomain = () => {
    if (deletingDomain) {
      deleteDomainMutation.mutate(deletingDomain.id);
      setDeletingDomain(null);
    }
  };

  // Filtrar domínios
  const filteredDomains = domains.filter(domain => {
    const matchesSearch = domain.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         domain.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         domain.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "all" || domain.domain_type === filterType;
    
    return matchesSearch && matchesType;
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="domain">Domínio/Subdomínio</Label>
                <Input
                  id="domain"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="exemplo.com ou sub.exemplo.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="domainType">Tipo</Label>
                <Select value={newDomainType} onValueChange={(value: "domain" | "subdomain") => setNewDomainType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domain">Domínio Principal</SelectItem>
                    <SelectItem value="subdomain">Subdomínio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="userEmail">Proprietário</Label>
                <Select value={newUserEmail} onValueChange={setNewUserEmail}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.email}>
                        {user.full_name || user.email} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por domínio, nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={(value: "all" | "domain" | "subdomain") => setFilterType(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="domain">Apenas domínios</SelectItem>
                <SelectItem value="subdomain">Apenas subdomínios</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filteredDomains.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {domains.length === 0 ? "Nenhum domínio cadastrado ainda" : "Nenhum domínio encontrado com os filtros aplicados"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domínio</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDomains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">{domain.domain}</TableCell>
                    <TableCell>
                      <Badge variant={domain.domain_type === 'subdomain' ? 'secondary' : 'default'}>
                        {domain.domain_type === 'subdomain' ? 'Subdomínio' : 'Domínio'}
                      </Badge>
                    </TableCell>
                    <TableCell>{domain.profiles?.full_name || 'Nome não informado'}</TableCell>
                    <TableCell>{domain.profiles?.email || 'Email não encontrado'}</TableCell>
                    <TableCell>
                      {new Date(domain.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingDomain(domain)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingDomain(domain)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <EditDomainModal
        domain={editingDomain}
        isOpen={!!editingDomain}
        onClose={() => setEditingDomain(null)}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingDomain}
        onClose={() => setDeletingDomain(null)}
        onConfirm={handleDeleteDomain}
        title="Excluir Domínio"
        description="Tem certeza que deseja excluir este domínio? Esta ação não pode ser desfeita."
        itemName={deletingDomain?.domain || ""}
        isLoading={deleteDomainMutation.isPending}
      />
    </div>
  );
};

export default DomainManagement;
