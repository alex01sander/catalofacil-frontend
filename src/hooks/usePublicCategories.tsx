
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  image?: string;
}

export const usePublicCategories = (enabled = true) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      // Busca todas as categorias sem filtrar por user_id
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('id, name, image')
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error('Error fetching categories:', fetchError);
        setError(fetchError.message);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [enabled]);

  const allCategories = useMemo(() => {
    return [
      {
        id: "todos",
        name: "Todos",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=80&h=80&fit=crop&crop=center"
      },
      ...categories
    ];
  }, [categories]);

  return {
    categories: allCategories,
    loading,
    error,
    refetch: fetchCategories
  };
};
