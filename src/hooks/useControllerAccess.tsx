
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

export const useControllerAccess = () => {
  const { user } = useAuth();
  const [isController, setIsController] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkControllerAccess = async () => {
      if (!user?.id) {
        setIsController(false);
        setLoading(false);
        return;
      }

      try {
        console.log('[DEBUG] Verificando acesso controller para user.id:', user.id);
        console.log('[DEBUG] URL da requisição:', `/api/controller-admins/${user.id}`);
        const { data } = await api.get(`/api/controller-admins/${user.id}`);
        console.log('[DEBUG] Resposta da API:', data);
        setIsController(!!data);
      } catch (error) {
        console.error('[DEBUG] Erro ao verificar acesso controller:', error);
        setIsController(false);
      } finally {
        setLoading(false);
      }
    };

    checkControllerAccess();
  }, [user?.id]);

  return { isController, loading };
};
