
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
  publicView?: boolean; // Para visualização pública da loja
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
    // Para visualização pública, não precisa de usuário autenticado
    if (!publicView && !user) {
      console.log('No authenticated user found for products');
      return [];
    }

    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Se não for visualização pública, filtrar pelo usuário
    if (!publicView && user) {
      query = query.eq('user_id', user.id);
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
  }, [selectedCategory, debouncedSearchTerm, user, publicView]);

  const queryKey = useMemo(() => [
    'products',
    publicView ? 'public' : user?.id,
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
    enabled: enabled && (publicView || !!user),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const filteredProducts = useMemo(() => {
    return products.filter(product => product.is_active);
  }, [products]);

  return {
    products: filteredProducts,
    loading: isLoading,
    error,
    refetch
  };
};
