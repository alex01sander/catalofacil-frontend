
import { useState, useEffect, useMemo, useRef } from "react";
import api from "@/services/api";
import { API_URL } from "@/constants/api";
import { useAuth } from '@/contexts/AuthContext';

export const useOptimizedProducts = (categoryId = null, enabled = true) => {
  const { token, loading: authLoading, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Cache para evitar requisições desnecessárias
  const lastFetchTime = useRef(0);
  const isFetching = useRef(false);
  const cacheKey = useRef('');

  // Função para buscar produtos (pode ser chamada sob demanda)
  const fetchProducts = async () => {
    // Evitar múltiplas requisições simultâneas
    if (isFetching.current) {
      console.log('[useOptimizedProducts] Já está buscando produtos, aguardando...');
      return;
    }

    // Cache de 60 segundos para evitar requisições excessivas
    const now = Date.now();
    const newCacheKey = `${categoryId}-${enabled}`;
    
    if (now - lastFetchTime.current < 60000 && 
        cacheKey.current === newCacheKey && 
        products.length > 0) {
      console.log('[useOptimizedProducts] Produtos em cache, usando dados existentes');
      return;
    }

    setLoading(true);
    setError(null);
    isFetching.current = true;
    
    const url = categoryId && categoryId !== "todos" 
      ? `/products?category_id=${categoryId}` 
      : "/products";
      
    try {
      console.log('[useOptimizedProducts] Buscando produtos:', url);
      const res = await api.get(url);
      
      // Verificar se é resposta paginada ou array direto
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        setProducts(res.data.data);
      } else if (Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        setProducts([]);
      }
      
      lastFetchTime.current = now;
      cacheKey.current = newCacheKey;
      console.log(`[useOptimizedProducts] ✅ ${products.length} produtos carregados`);
      
    } catch (err) {
      console.error('[useOptimizedProducts] Erro na fetchProducts:', err);
      setError(err || new Error('Erro desconhecido'));
      setProducts([]);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    
    if (!enabled) {
      setLoading(false);
      return;
    }
    
    if (!user && !token) {
      setLoading(false);
      return;
    }
    
    fetchProducts();
  }, [user, token, authLoading, enabled, categoryId]);

  // Função para forçar atualização (usada quando necessário)
  const refetch = () => {
    lastFetchTime.current = 0; // Forçar nova busca
    fetchProducts();
  };

  return { products, loading, error, refetch };
};
