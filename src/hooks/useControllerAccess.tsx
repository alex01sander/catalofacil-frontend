
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';

export const useControllerAccess = () => {
  const { user } = useAuth();
  const [isController, setIsController] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkControllerAccess = async () => {
      if (!user?.id) {
        setIsController(false);
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get(`/controller-admins/${user.id}`);
        setIsController(!!data);
      } catch (error) {
        setIsController(false);
      } finally {
        setLoading(false);
      }
    };

    checkControllerAccess();
  }, [user?.id]);

  return { isController, loading };
};
