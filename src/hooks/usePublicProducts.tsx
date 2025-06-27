
import { useState, useEffect, useMemo, useCallback } from 'react';
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

interface UsePublicProductsProps {
  searchTerm?: string;
  selectedCategory?: string;
  enabled?: boolean;
}

export const usePublicProducts = ({
  searchTerm = '',
  selectedCategory = 'todos',
  enabled = true
}: UsePublicProductsProps = {}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchProducts = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true) // Apenas produtos ativos para visualização pública
        .order('created_at', { ascending: false });

      // Apply category filter
      if (selectedCategory && selectedCategory !== 'todos') {
        query = query.eq('category_id', selectedCategory);
      }

      // Apply search filter
      if (debouncedSearchTerm.trim()) {
        query = query.ilike('name', `%${debouncedSearchTerm}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching products:', fetchError);
        setError(fetchError.message);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, debouncedSearchTerm, enabled]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => product.is_active);
  }, [products]);

  return {
    products: filteredProducts,
    loading,
    error,
    refetch: fetchProducts
  };
};
