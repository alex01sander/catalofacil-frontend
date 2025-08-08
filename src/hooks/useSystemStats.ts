import { useState, useEffect } from 'react';
import api from '@/services/api';

interface SystemStats {
  total_users: number;
  total_admins: number;
  total_clients: number;
  total_domains: number;
  total_stores: number;
}

export const useSystemStats = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Como não há rota específica de estatísticas, vamos calcular baseado nos usuários
      const response = await api.get('/api/admin-management/users');
      const users = response.data.users;
      
      const total_users = users.length;
      const total_admins = users.filter((user: any) => user.role === 'admin').length;
      const total_clients = users.filter((user: any) => user.role === 'user').length;
      
      // Por enquanto, vamos usar valores padrão para domínios e lojas
      // até que essas rotas sejam implementadas no backend
      const total_domains = total_users; // Assumindo 1 domínio por usuário
      const total_stores = total_users; // Assumindo 1 loja por usuário
      
      setStats({
        total_users,
        total_admins,
        total_clients,
        total_domains,
        total_stores
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, fetchStats };
}; 