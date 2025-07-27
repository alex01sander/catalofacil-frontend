
import { useState, useEffect, useMemo, useRef } from "react";
import api from "@/services/api";
import { API_URL } from "@/constants/api";
import { useAuth } from '@/contexts/AuthContext';

// Cache global para produtos
let globalProductsCache = {
  data: [],
  timestamp: 0,
  isFetching: false
};

export const useOptimizedProducts = (categoryId = null, enabled = true) => {
  const { token, loading: authLoading, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para buscar produtos (pode ser chamada sob demanda)
  const fetchProducts = async () => {
    // Verificar cache global primeiro
    const now = Date.now();
    const cacheValid = now - globalProductsCache.timestamp < 120000; // 2 minutos
    
    if (globalProductsCache.isFetching) {
      console.log('[useOptimizedProducts] Requisição global em andamento, aguardando...');
      return;
    }

    if (cacheValid && globalProductsCache.data.length > 0) {
      console.log('[useOptimizedProducts] Usando cache global');
      setProducts(globalProductsCache.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    globalProductsCache.isFetching = true;
    
    const url = categoryId && categoryId !== "todos" 
      ? `/products?category_id=${categoryId}` 
      : "/products";
      
    try {
      console.log('[useOptimizedProducts] Buscando produtos:', url);
      const res = await api.get(url);
      
      let productsData = [];
      // Verificar se é resposta paginada ou array direto
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        productsData = res.data.data;
      } else if (Array.isArray(res.data)) {
        productsData = res.data;
      } else {
        productsData = [];
      }
      
      // Atualizar cache global
      globalProductsCache.data = productsData;
      globalProductsCache.timestamp = now;
      
      setProducts(productsData);
      console.log(`[useOptimizedProducts] ✅ ${productsData.length} produtos carregados`);
      
    } catch (err) {
      console.error('[useOptimizedProducts] Erro na fetchProducts:', err);
      setError(err || new Error('Erro desconhecido'));
      setProducts([]);
    } finally {
      setLoading(false);
      globalProductsCache.isFetching = false;
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
    
    // Debounce para evitar múltiplas requisições
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 1000); // 1 segundo de debounce
    
    return () => clearTimeout(timeoutId);
  }, [user, token, authLoading, enabled, categoryId]);

  // Função para forçar atualização (usada quando necessário)
  const refetch = () => {
    globalProductsCache.timestamp = 0; // Forçar nova busca
    fetchProducts();
  };

  return { products, loading, error, refetch };
};
