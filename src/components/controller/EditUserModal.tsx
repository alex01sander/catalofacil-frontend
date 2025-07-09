import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

interface EditUserModalProps {
  user: {
    id: string;
    email: string;
    full_name: string;
    domain_owners: { domain: string }[];
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditUserModal = ({ user, isOpen, onClose }: EditUserModalProps) => {
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isControllerAdmin, setIsControllerAdmin] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setEditName(user.full_name || "");
      setEditEmail(user.email);
      setNewPassword("");
      setShowPassword(false);
      
      // Verificar se o usuário é controller admin
      checkControllerAdminStatus(user.id);
    }
  }, [user]);

  const checkControllerAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('controller_admins')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!error) {
        setIsControllerAdmin(!!data);
      }
    } catch (error) {
      console.error('Erro ao verificar status de admin:', error);
    }
  };

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, name, email }: { 
      userId: string; 
      name: string; 
      email: string;
    }) => {
      // Atualizar o perfil
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: name.trim() || null,
          email: email.trim()
        })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active_users'] });
      toast.success("Usuário atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar usuário");
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userEmail, password }: { userEmail: string; password: string }) => {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: {
          userEmail,
          newPassword: password
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      toast.success("Senha redefinida com sucesso!");
      setNewPassword("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao redefinir senha");
    }
  });

  const toggleControllerAdminMutation = useMutation({
    mutationFn: async ({ userId, email, shouldBeAdmin }: { 
      userId: string; 
      email: string; 
      shouldBeAdmin: boolean; 
    }) => {
      if (shouldBeAdmin) {
        // Adicionar como controller admin
        const { error } = await supabase
          .from('controller_admins')
          .insert({ user_id: userId, email });
        
        if (error && !error.message.includes('duplicate')) throw error;
      } else {
        // Remover de controller admin
        const { error } = await supabase
          .from('controller_admins')
          .delete()
          .eq('user_id', userId);
        
        if (error) throw error;
      }
    },
    onSuccess: (_, { shouldBeAdmin }) => {
      setIsControllerAdmin(shouldBeAdmin);
      toast.success(shouldBeAdmin ? "Usuário promovido a Controller Admin!" : "Usuário removido de Controller Admin!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao alterar permissões");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editName.trim() || !editEmail.trim()) {
      toast.error("Nome e email são obrigatórios");
      return;
    }
    
    updateUserMutation.mutate({ 
      userId: user.id,
      name: editName, 
      email: editEmail
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPassword.trim()) {
      toast.error("Digite uma nova senha");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    
    resetPasswordMutation.mutate({ 
      userEmail: user.email,
      password: newPassword
    });
  };

  const handleToggleControllerAdmin = () => {
    if (!user) return;
    
    toggleControllerAdminMutation.mutate({
      userId: user.id,
      email: user.email,
      shouldBeAdmin: !isControllerAdmin
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Edite as informações do usuário selecionado
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Editar informações básicas */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Nome Completo</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nome do usuário"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="email@exemplo.com"
                required
              />
            </div>

            <Button 
              type="submit" 
              disabled={updateUserMutation.isPending}
              className="w-full"
            >
              {updateUserMutation.isPending ? "Salvando..." : "Salvar Informações"}
            </Button>
          </form>

          <Separator />

          {/* Reset de senha */}
          <form onSubmit={handleResetPassword} className="space-y-4">
            <h4 className="font-medium">Redefinir Senha</h4>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={resetPasswordMutation.isPending || !newPassword.trim()}
              variant="outline"
              className="w-full"
            >
              {resetPasswordMutation.isPending ? "Redefinindo..." : "Redefinir Senha"}
            </Button>
          </form>

          <Separator />

          {/* Permissões */}
          <div className="space-y-4">
            <h4 className="font-medium">Permissões</h4>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="controllerAdmin"
                checked={isControllerAdmin}
                onCheckedChange={handleToggleControllerAdmin}
                disabled={toggleControllerAdminMutation.isPending}
              />
              <Label htmlFor="controllerAdmin" className="text-sm">
                Controller Admin
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Controller Admins podem gerenciar usuários e domínios
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;