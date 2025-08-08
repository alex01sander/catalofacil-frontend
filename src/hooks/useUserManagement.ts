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
      const response = await api.get('/api/admin-management/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
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