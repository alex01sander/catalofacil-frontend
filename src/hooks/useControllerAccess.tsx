
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

export const useControllerAccess = () => {
  const { user } = useAuth();
  const [isControllerAdmin, setIsControllerAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  console.log('[useControllerAccess] Hook inicializado');
  console.log('[useControllerAccess] Estado inicial:', { isControllerAdmin, loading });

  useEffect(() => {
    console.log('[useControllerAccess] useEffect disparado');
    console.log('[useControllerAccess] user?.id:', user?.id);
    
    const checkControllerAccess = async () => {
      if (!user?.id) {
        console.log('[useControllerAccess] ❌ Sem user.id, definindo isControllerAdmin como false');
        setIsControllerAdmin(false);
        setLoading(false);
        return;
      }

      try {
        console.log('[DEBUG] Verificando acesso controller para user.id:', user.id);
        console.log('[DEBUG] URL da requisição:', `/api/controller-admins/${user.id}`);
        
        // Aguardar um pouco para garantir que o token esteja disponível
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data } = await api.get(`/api/controller-admins/${user.id}`);
        console.log('[DEBUG] Resposta da API:', data);
        
        // Verificar se a resposta contém isAdmin: true
        console.log('[DEBUG] 🔍 Verificando estrutura da resposta:', data);
        console.log('[DEBUG] 🔍 data.isAdmin:', data?.isAdmin);
        console.log('[DEBUG] 🔍 typeof data.isAdmin:', typeof data?.isAdmin);
        
        if (data && data.isAdmin === true) {
          console.log('[DEBUG] ✅ Usuário é admin controller');
          setIsControllerAdmin(true);
        } else {
          console.log('[DEBUG] ❌ Usuário não é admin controller');
          console.log('[DEBUG] ❌ Motivo: data.isAdmin não é true');
          setIsControllerAdmin(false);
        }
      } catch (error) {
        console.error('[DEBUG] Erro ao verificar acesso controller:', error);
        setIsControllerAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkControllerAccess();
  }, [user?.id]);

  console.log('[useControllerAccess] Retornando:', { isControllerAdmin, loading });
  return { isControllerAdmin, loading };
};
