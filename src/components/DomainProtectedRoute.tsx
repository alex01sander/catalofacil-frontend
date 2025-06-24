
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDomainAccess } from '@/hooks/useDomainAccess';

interface DomainProtectedRouteProps {
  children: ReactNode;
}

const DomainProtectedRoute = ({ children }: DomainProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { allowAccess, loading: domainLoading, currentDomain, isOwner } = useDomainAccess();

  // Se ainda está carregando a autenticação, mostrar loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Se não está logado, redirecionar para login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se está carregando informações do domínio, mostrar loading
  if (domainLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Agora que está logado, verificar se tem acesso ao domínio
  if (!allowAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">
            Você não tem permissão para acessar esta loja.
          </p>
          <p className="text-sm text-gray-500">
            Domínio: <code className="bg-gray-100 px-2 py-1 rounded">{currentDomain}</code>
          </p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Fazer Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default DomainProtectedRoute;
