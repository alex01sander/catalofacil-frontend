
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const UserCreation = () => {
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: async ({ email, password, fullName }: { email: string; password: string; fullName: string }) => {
      console.log('Tentando criar usuário:', { email, fullName });
      
      // Usar signup normal em vez de admin.createUser
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        console.error('Erro no signup:', error);
        throw error;
      }

      console.log('Usuário criado com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active_users'] });
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      toast.success("Usuário criado com sucesso! Um email de confirmação foi enviado.");
    },
    onError: (error: any) => {
      console.error('Erro ao criar usuário:', error);
      toast.error(error.message || "Erro ao criar usuário");
    }
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      toast.error("Email e senha são obrigatórios");
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    
    createUserMutation.mutate({ 
      email: newUserEmail.trim(), 
      password: newUserPassword.trim(),
      fullName: newUserName.trim() || newUserEmail.trim()
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Criar Novo Usuário
        </CardTitle>
        <CardDescription>
          Crie uma nova conta de usuário no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="userEmail">Email *</Label>
              <Input
                id="userEmail"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="usuario@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="userName">Nome Completo</Label>
              <Input
                id="userName"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Nome do usuário"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="userPassword">Senha *</Label>
            <Input
              id="userPassword"
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>
          <Button 
            type="submit" 
            disabled={createUserMutation.isPending}
            className="w-full md:w-auto"
          >
            {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserCreation;
