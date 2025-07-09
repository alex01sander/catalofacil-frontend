import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface EditDomainModalProps {
  domain: {
    id: string;
    domain: string;
    domain_type: string;
    user_id: string;
    profiles: {
      full_name: string;
      email: string;
    } | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditDomainModal = ({ domain, isOpen, onClose }: EditDomainModalProps) => {
  const [editDomain, setEditDomain] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editDomainType, setEditDomainType] = useState<"domain" | "subdomain">("domain");
  const queryClient = useQueryClient();

  // Buscar todos os usuários para o select
  const { data: users = [] } = useQuery({
    queryKey: ['all_users_for_domain_edit'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('email');
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen
  });

  useEffect(() => {
    if (domain) {
      setEditDomain(domain.domain);
      setEditUserEmail(domain.profiles?.email || "");
      setEditDomainType((domain.domain_type as "domain" | "subdomain") || "domain");
    }
  }, [domain]);

  const updateDomainMutation = useMutation({
    mutationFn: async ({ domainId, newDomain, newUserEmail, domainType }: { 
      domainId: string; 
      newDomain: string; 
      newUserEmail: string;
      domainType: "domain" | "subdomain";
    }) => {
      // Validar formato do domínio
      const domainRegex = domainType === 'subdomain' 
        ? /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?){2,}$/
        : /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
      
      if (!domainRegex.test(newDomain.toLowerCase())) {
        throw new Error(`Formato inválido para ${domainType === 'subdomain' ? 'subdomínio' : 'domínio'}`);
      }

      // Buscar o usuário pelo email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newUserEmail)
        .single();

      if (profileError || !profile) {
        throw new Error('Usuário não encontrado com este email');
      }

      // Verificar se já existe um domínio com o mesmo nome
      const { data: existingDomain, error: checkError } = await supabase
        .from('domain_owners')
        .select('id')
        .eq('domain', newDomain.toLowerCase())
        .neq('id', domainId)
        .maybeSingle();

      if (checkError) throw checkError;
      
      if (existingDomain) {
        throw new Error('Este domínio já está cadastrado');
      }

      // Atualizar o domínio
      const { error } = await supabase
        .from('domain_owners')
        .update({ 
          domain: newDomain.toLowerCase(), 
          user_id: profile.id,
          domain_type: domainType
        })
        .eq('id', domainId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain_owners'] });
      toast.success("Domínio atualizado com sucesso!");
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar domínio");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain || !editDomain.trim() || !editUserEmail.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    
    updateDomainMutation.mutate({ 
      domainId: domain.id,
      newDomain: editDomain.trim(), 
      newUserEmail: editUserEmail.trim(),
      domainType: editDomainType
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Editar Domínio</DialogTitle>
          <DialogDescription>
            Edite as informações do domínio selecionado
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editDomain">Domínio/Subdomínio</Label>
            <Input
              id="editDomain"
              value={editDomain}
              onChange={(e) => setEditDomain(e.target.value)}
              placeholder="exemplo.com ou sub.exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editDomainType">Tipo</Label>
            <Select value={editDomainType} onValueChange={(value: "domain" | "subdomain") => setEditDomainType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="domain">Domínio Principal</SelectItem>
                <SelectItem value="subdomain">Subdomínio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editUserEmail">Proprietário</Label>
            <Select value={editUserEmail} onValueChange={setEditUserEmail}>
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateDomainMutation.isPending}
            >
              {updateDomainMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDomainModal;