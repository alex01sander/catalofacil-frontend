
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
    // Primeiro, buscar o proprietário do domínio atual
    const { data: storeOwner, error: ownerError } = await supabase.rpc('get_current_store_owner');
    
    if (ownerError) {
      console.error('Error getting store owner:', ownerError);
      throw ownerError;
    }

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, image')
      .eq('user_id', storeOwner) // Filtrar apenas categorias do proprietário do domínio
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
