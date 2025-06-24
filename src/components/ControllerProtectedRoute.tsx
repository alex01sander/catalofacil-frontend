
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useControllerAccess } from '@/hooks/useControllerAccess';

interface ControllerProtectedRouteProps {
  children: ReactNode;
}

const ControllerProtectedRoute = ({ children }: ControllerProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isControllerAdmin, loading: accessLoading } = useControllerAccess();

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

  if (!user) {
    return <Navigate to="/auth" replace />;
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
          <p className="text-sm text-gray-500">
            Apenas administradores autorizados podem acessar esta área.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ControllerProtectedRoute;
