
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDomainAccess } from '@/hooks/useDomainAccess';
import { Button } from '@/components/ui/button';
import { LogOut, Shield } from 'lucide-react';

interface DomainProtectedRouteProps {
  children: ReactNode;
}

const DomainProtectedRoute = ({ children }: DomainProtectedRouteProps) => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { allowAccess, loading: domainLoading, currentDomain, isOwner } = useDomainAccess();

  // Show loading during authentication check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading during domain access check
  if (domainLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando permissões de domínio...</p>
        </div>
      </div>
    );
  }

  // Secure logout function
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Enhanced access denied screen with security information
  if (!allowAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar este domínio.
          </p>
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Usuário:</span> {user.email}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Domínio:</span> 
              <code className="bg-gray-200 px-1 py-0.5 rounded text-xs ml-1">
                {currentDomain}
              </code>
            </p>
          </div>
          <div className="space-y-2">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Fazer Logout
            </Button>
            <p className="text-xs text-gray-500">
              Entre em contato com o administrador se você deveria ter acesso a este domínio.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DomainProtectedRoute;
