
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DomainOwner {
  id: string;
  domain: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useDomainAccess = () => {
  const { user } = useAuth();
  const [currentDomain, setCurrentDomain] = useState<string>('');

  useEffect(() => {
    // Obter o domínio atual
    const domain = window.location.hostname;
    setCurrentDomain(domain);
  }, []);

  const fetchDomainOwnership = async (): Promise<DomainOwner | null> => {
    if (!currentDomain) return null;

    const { data, error } = await supabase
      .from('domain_owners')
      .select('*')
      .eq('domain', currentDomain)
      .maybeSingle();

    if (error) {
      console.error('Error fetching domain ownership:', error);
      throw error;
    }

    return data;
  };

  const {
    data: domainOwner,
    isLoading,
    error
  } = useQuery({
    queryKey: ['domain_ownership', currentDomain],
    queryFn: fetchDomainOwnership,
    enabled: !!currentDomain,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  // Verificar se o usuário atual é o dono do domínio
  const isOwner = user && domainOwner && user.id === domainOwner.user_id;
  
  // Se não há domainOwner definido, permitir acesso (para desenvolvimento local)
  const allowAccess = !domainOwner || isOwner;

  return {
    currentDomain,
    domainOwner,
    isOwner: !!isOwner,
    allowAccess,
    loading: isLoading,
    error,
    userId: domainOwner?.user_id
  };
};
