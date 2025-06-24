
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDomainAccess } from '@/hooks/useDomainAccess';

export const useDomainFilteredData = () => {
  const { user } = useAuth();
  const { domainOwner, allowAccess, userId: domainUserId, currentDomain } = useDomainAccess();

  const effectiveUserId = useMemo(() => {
    // Para localhost, usar o usuário atual se estiver logado
    const isLocalhost = currentDomain === 'localhost' || currentDomain === '127.0.0.1';
    if (isLocalhost) {
      return user?.id || null;
    }
    
    // Para domínios reais, usar o ID do dono do domínio
    return domainUserId || user?.id || null;
  }, [domainUserId, user?.id, currentDomain]);

  // Para visualização pública, sempre permitir acesso aos dados
  const publicAccess = !!effectiveUserId;

  return {
    effectiveUserId,
    allowAccess: publicAccess, // Sempre permitir acesso aos dados do catálogo
    isDomainOwner: domainUserId === user?.id,
    domainOwner,
    isAuthenticated: !!user
  };
};
