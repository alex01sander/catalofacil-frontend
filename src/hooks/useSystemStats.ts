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
      const response = await api.get('/api/admin-management/stats');
      setStats(response.data);
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