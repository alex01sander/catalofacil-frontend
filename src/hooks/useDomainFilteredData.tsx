
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDomainAccess } from '@/hooks/useDomainAccess';

export const useDomainFilteredData = () => {
  const { user } = useAuth();
  const { domainOwner, allowAccess, userId: domainUserId, currentDomain } = useDomainAccess();

  // Retorna o ID do usuário que deve ser usado para filtrar dados
  // APENAS se o acesso for permitido e houver um dono do domínio definido
  const effectiveUserId = useMemo(() => {
    if (!allowAccess) return null;
    
    // Para localhost, usar o usuário atual
    const isLocalhost = currentDomain === 'localhost' || currentDomain === '127.0.0.1';
    if (isLocalhost) {
      return user?.id || null;
    }
    
    // Para domínios reais, usar apenas o ID do dono do domínio
    return domainUserId || null;
  }, [allowAccess, domainUserId, user?.id, currentDomain]);

  return {
    effectiveUserId,
    allowAccess,
    isDomainOwner: domainUserId === user?.id,
    domainOwner
  };
};
