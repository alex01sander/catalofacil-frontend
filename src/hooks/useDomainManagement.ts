import { useState, useEffect } from 'react';
import api from '@/services/api';
import { toast } from 'sonner';

interface Domain {
  id: string;
  domain: string;
  created_at: string;
  owner_email: string;
  owner_role: string;
  store_name?: string;
  store_slug?: string;
}

interface DomainFormData {
  domain: string;
  userEmail: string;
  domainType: 'domain' | 'subdomain';
}

export const useDomainManagement = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDomains = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin-management/domains');
      setDomains(response.data.domains || response.data);
    } catch (error) {
      console.error('Erro ao buscar domínios:', error);
      toast.error('Erro ao carregar domínios');
    } finally {
      setLoading(false);
    }
  };

  const createDomain = async (domainData: DomainFormData) => {
    try {
      const response = await api.post('/api/admin-management/domains', domainData);
      await fetchDomains(); // Recarregar lista
      toast.success('Domínio criado com sucesso!');
      return response.data;
    } catch (error) {
      console.error('Erro ao criar domínio:', error);
      toast.error('Erro ao criar domínio');
      throw error;
    }
  };

  const deleteDomain = async (domainId: string) => {
    try {
      await api.delete(`/api/admin-management/domains/${domainId}`);
      await fetchDomains(); // Recarregar lista
      toast.success('Domínio deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar domínio:', error);
      toast.error('Erro ao deletar domínio');
      throw error;
    }
  };

  return { domains, loading, fetchDomains, createDomain, deleteDomain };
}; 