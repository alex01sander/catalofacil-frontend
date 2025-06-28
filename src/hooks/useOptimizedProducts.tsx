
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  images: string[];
  description: string;
  category_id: string | null;
  is_active: boolean;
  stock: number;
  user_id: string;
}

interface UseOptimizedProductsProps {
  searchTerm?: string;
  selectedCategory?: string;
  enabled?: boolean;
  publicView?: boolean;
}

export const useOptimizedProducts = ({
  searchTerm = '',
  selectedCategory = 'todos',
  enabled = true,
  publicView = false
}: UseOptimizedProductsProps = {}) => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchProducts = useCallback(async (): Promise<Product[]> => {
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (selectedCategory && selectedCategory !== 'todos') {
      query = query.eq('category_id', selectedCategory);
    }

    if (debouncedSearchTerm.trim()) {
      query = query.ilike('name', `%${debouncedSearchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return data || [];
  }, [selectedCategory, debouncedSearchTerm]);

  const {
    data: products = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [`products-public-${selectedCategory}-${debouncedSearchTerm}`],
    queryFn: fetchProducts,
    enabled: enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    products,
    loading: isLoading,
    error,
    refetch
  };
};
