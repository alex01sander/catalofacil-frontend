
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDomainFilteredData } from '@/hooks/useDomainFilteredData';

interface Category {
  id: string;
  name: string;
  image?: string;
}

export const useOptimizedCategories = (enabled = true) => {
  const { user } = useAuth();
  const { effectiveUserId, allowAccess } = useDomainFilteredData();

  const fetchCategories = async (): Promise<Category[]> => {
    const targetUserId = effectiveUserId || user?.id;
    
    if (!targetUserId || !allowAccess) {
      console.log('No user ID found or access not allowed for categories');
      return [];
    }

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, image')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    return data || [];
  };

  const {
    data: fetchedCategories = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['categories', effectiveUserId],
    queryFn: fetchCategories,
    enabled: enabled && !!effectiveUserId && allowAccess,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  const categories = useMemo(() => {
    const allCategories = [
      {
        id: "todos",
        name: "Todos",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=80&h=80&fit=crop&crop=center"
      },
      ...fetchedCategories
    ];
    
    return allCategories;
  }, [fetchedCategories]);

  return {
    categories,
    loading: isLoading,
    error
  };
};
