
import { ReactNode, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useControllerAccess } from '@/hooks/useControllerAccess';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

interface ControllerProtectedRouteProps {
  children: ReactNode;
}

const ControllerProtectedRoute = ({ children }: ControllerProtectedRouteProps) => {
  const { user, loading: authLoading, signIn } = useAuth();
  const { isControllerAdmin, loading: accessLoading } = useControllerAccess();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error('Email e senha são obrigatórios');
      return;
    }

    setLoginLoading(true);

    try {
      const result = await signIn(email, password);
      
      if (result.error) {
        const errorMessage = result.error.message?.includes('Invalid login credentials') 
          ? 'Email ou senha incorretos'
          : 'Erro ao fazer login. Tente novamente.';
          
        toast.error(errorMessage);
      } else {
        toast.success('Login realizado com sucesso!');
      }
    } catch (error: any) {
      toast.error('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoginLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Acesso ao Painel Controller
            </CardTitle>
            <CardDescription>
              Faça login com uma conta de administrador para acessar o painel controller
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email do Administrador</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@email.com"
                  required
                  autoComplete="email"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    required
                    autoComplete="current-password"
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
              
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? "Entrando..." : "Entrar no Controller"}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => window.location.href = '/'}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Voltar ao Início
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isControllerAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar o painel controller.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Apenas administradores autorizados podem acessar esta área.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.href = '/auth'}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Fazer Login com Conta Admin
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ControllerProtectedRoute;
