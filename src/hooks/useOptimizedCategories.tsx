
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  image?: string;
}

export const useOptimizedCategories = (enabled = true) => {
  const fetchCategories = async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, image')
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
    queryKey: ['categories-domain'],
    queryFn: fetchCategories,
    enabled: enabled,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const categories = useMemo(() => {
    return [
      {
        id: "todos",
        name: "Todos",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=80&h=80&fit=crop&crop=center"
      },
      ...fetchedCategories
    ];
  }, [fetchedCategories]);

  return {
    categories,
    loading: isLoading,
    error
  };
};
