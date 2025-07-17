
import { useQuery } from "@tanstack/react-query";
import axios from 'axios';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/contexts/AuthContext';

export const useControllerAccess = () => {
  const { user, token } = useAuth();

  const { data: isControllerAdmin = false, isLoading } = useQuery({
    queryKey: ['controller_access', user?.id],
    queryFn: async () => {
      if (!user || !token) return false;
      try {
        const { data } = await axios.get(`${API_URL}/controller-admins/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return !!data.isControllerAdmin;
      } catch {
        return false;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return {
    isControllerAdmin,
    loading: isLoading,
  };
};
