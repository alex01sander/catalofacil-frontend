
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDomainAccess } from '@/hooks/useDomainAccess';

export const useDomainFilteredData = () => {
  const { user } = useAuth();
  const { domainOwner, allowAccess, userId: domainUserId } = useDomainAccess();

  // Retorna o ID do usuário que deve ser usado para filtrar dados
  // Se há um dono do domínio definido, usar o ID dele
  // Caso contrário, usar o ID do usuário atual (para desenvolvimento local)
  const effectiveUserId = useMemo(() => {
    if (!allowAccess) return null;
    return domainUserId || user?.id || null;
  }, [allowAccess, domainUserId, user?.id]);

  return {
    effectiveUserId,
    allowAccess,
    isDomainOwner: domainUserId === user?.id,
    domainOwner
  };
};
