
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useSimplifiedData = () => {
  const { user } = useAuth();

  const effectiveUserId = useMemo(() => {
    return user?.id || null;
  }, [user?.id]);

  return {
    effectiveUserId,
    allowAccess: !!user,
    isAuthenticated: !!user
  };
};
