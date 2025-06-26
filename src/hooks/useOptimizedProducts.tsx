
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchProducts = useCallback(async (): Promise<Product[]> => {
    if (!user?.id) {
      console.log('No user ID found for products');
      return [];
    }

    let query = supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Para visualização pública, filtrar apenas produtos ativos
    if (publicView) {
      query = query.eq('is_active', true);
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== 'todos') {
      query = query.eq('category_id', selectedCategory);
    }

    // Apply search filter
    if (debouncedSearchTerm.trim()) {
      query = query.ilike('name', `%${debouncedSearchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    return data || [];
  }, [selectedCategory, debouncedSearchTerm, user?.id, publicView]);

  const queryKey = useMemo(() => [
    'products',
    publicView ? 'public' : 'private',
    user?.id,
    selectedCategory,
    debouncedSearchTerm
  ], [selectedCategory, debouncedSearchTerm, user?.id, publicView]);

  const {
    data: products = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: fetchProducts,
    enabled: enabled && !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });

  const filteredProducts = useMemo(() => {
    return products.filter(product => publicView ? product.is_active : true);
  }, [products, publicView]);

  return {
    products: filteredProducts,
    loading: isLoading,
    error,
    refetch
  };
};
