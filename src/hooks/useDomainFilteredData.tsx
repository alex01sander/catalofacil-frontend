
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
    
    // Para domínios reais, usar o ID do dono do domínio se existir,
    // caso contrário usar o usuário logado (para casos onde o domain_owner não foi configurado)
    return domainUserId || user?.id || null;
  }, [domainUserId, user?.id, currentDomain]);

  // Permitir acesso se há usuário efetivo
  const publicAccess = !!effectiveUserId;

  console.log('Domain Filtered Data Debug:', {
    effectiveUserId,
    allowAccess,
    domainUserId,
    currentUserId: user?.id,
    currentDomain,
    publicAccess
  });

  return {
    effectiveUserId,
    allowAccess: publicAccess,
    isDomainOwner: domainUserId === user?.id,
    domainOwner,
    isAuthenticated: !!user
  };
};
