
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
    // Buscar todas as categorias sem filtro de usuário para visualização pública
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
    queryKey: ['categories', 'public'],
    queryFn: fetchCategories,
    enabled: enabled,
    staleTime: 30 * 60 * 1000, // 30 minutos - cache mais longo
    gcTime: 60 * 60 * 1000, // 1 hora
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
