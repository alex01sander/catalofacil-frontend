import { useState, useEffect } from 'react';
import api from '@/services/api';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at?: string;
  domain?: string;
  store_name?: string;
  store_slug?: string;
}

interface UserFormData {
  email: string;
  password: string;
  role: 'admin' | 'user';
  domain?: string;
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Debug: verificar token e URL
      const token = localStorage.getItem('token');
      console.log('[DEBUG] Token disponível:', !!token);
      console.log('[DEBUG] Token (primeiros 20 chars):', token ? token.substring(0, 20) + '...' : 'Nenhum');
      console.log('[DEBUG] URL sendo chamada:', '/api/admin-management/users');
      
      // Teste de conectividade básica
      console.log('[DEBUG] Testando conectividade básica...');
      try {
        const healthResponse = await api.get('/');
        console.log('[DEBUG] Conectividade OK:', healthResponse.status);
      } catch (healthError) {
        console.log('[DEBUG] Problema de conectividade:', healthError.response?.status);
      }
      
      // Teste: verificar se outras rotas funcionam
      try {
        console.log('[DEBUG] Testando rota de verificação de token...');
        const testResponse = await api.get('/auth/verify');
        console.log('[DEBUG] Rota de verificação funcionou:', testResponse.status);
      } catch (testError) {
        console.log('[DEBUG] Rota de verificação falhou:', testError.response?.status);
      }
      
      const response = await api.get('/api/admin-management/users');
      console.log('[DEBUG] Resposta recebida:', response.data);
      setUsers(response.data.users || response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      console.error('Detalhes do erro:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        baseURL: error.config?.baseURL
      });
      
      // Tratar diferentes tipos de erro
      if (error.response?.status === 401) {
        console.log('[DEBUG] Erro 401 - Token inválido ou expirado');
        toast.error('Sessão expirada. Faça login novamente.');
        // Não redirecionar automaticamente - deixar o usuário decidir
        return;
      }
      
      if (error.response?.status === 403) {
        console.log('[DEBUG] Erro 403 - Acesso negado');
        toast.error('Acesso negado. Você não tem permissão para acessar esta funcionalidade.');
        return;
      }
      
      // Se for 404, tentar rota alternativa
      if (error.response?.status === 404) {
        console.log('[DEBUG] Tentando rota alternativa /users...');
        try {
          const altResponse = await api.get('/users');
          console.log('[DEBUG] Rota alternativa funcionou:', altResponse.data);
          setUsers(altResponse.data.users || altResponse.data);
          return;
        } catch (altError) {
          console.error('[DEBUG] Rota alternativa também falhou:', altError.response?.status);
        }
      }
      
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: UserFormData) => {
    try {
      const response = await api.post('/api/admin-management/users', userData);
      await fetchUsers(); // Recarregar lista
      toast.success('Usuário criado com sucesso!');
      return response.data;
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast.error('Erro ao criar usuário');
      throw error;
    }
  };

  const updateUser = async (userId: string, userData: Partial<UserFormData>) => {
    try {
      const response = await api.put(`/api/admin-management/users/${userId}`, userData);
      await fetchUsers(); // Recarregar lista
      toast.success('Usuário atualizado com sucesso!');
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário');
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await api.delete(`/api/admin-management/users/${userId}`);
      await fetchUsers(); // Recarregar lista
      toast.success('Usuário deletado com sucesso!');
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast.error('Erro ao deletar usuário');
      throw error;
    }
  };

  return { users, loading, fetchUsers, createUser, updateUser, deleteUser };
}; 