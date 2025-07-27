
import { useState, useEffect, useMemo, useRef } from "react";
import api from "@/services/api";
import { API_URL } from "@/constants/api";
import { useAuth } from '@/contexts/AuthContext';

// Cache global para categorias
let globalCategoriesCache = {
  data: [],
  timestamp: 0,
  isFetching: false
};

export const useOptimizedCategories = (enabled = true) => {
  const { token, loading: authLoading, user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    // Verificar cache global primeiro
    const now = Date.now();
    const cacheValid = now - globalCategoriesCache.timestamp < 120000; // 2 minutos
    
    if (globalCategoriesCache.isFetching) {
      console.log('[useOptimizedCategories] Requisição global em andamento, aguardando...');
      return;
    }

    if (cacheValid && globalCategoriesCache.data.length > 0) {
      console.log('[useOptimizedCategories] Usando cache global');
      setCategories(globalCategoriesCache.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    globalCategoriesCache.isFetching = true;
    
    try {
      console.log('[useOptimizedCategories] Buscando categorias...');
      const res = await api.get('/categorias');
      
      let categoriesData = [];
      // Verificar se é resposta paginada ou array direto
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        categoriesData = res.data.data;
      } else if (Array.isArray(res.data)) {
        categoriesData = res.data;
      } else {
        categoriesData = [];
      }
      
      // Atualizar cache global
      globalCategoriesCache.data = categoriesData;
      globalCategoriesCache.timestamp = now;
      
      setCategories(categoriesData);
      console.log(`[useOptimizedCategories] ✅ ${categoriesData.length} categorias carregadas`);
      
    } catch (err) {
      console.error('[useOptimizedCategories] Erro ao carregar categorias:', err);
      setError(err);
      setCategories([]);
    } finally {
      setLoading(false);
      globalCategoriesCache.isFetching = false;
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
      fetchCategories();
    }, 1500); // 1.5 segundos de debounce
    
    return () => clearTimeout(timeoutId);
  }, [user, token, authLoading, enabled]);

  const allCategories = useMemo(() => [
    {
      id: "todos",
      name: "Todos",
      image: "https://static.vecteezy.com/ti/vetor-gratis/p1/453289-vitrine-de-brinquedos-vetor.jpg"
    },
    ...categories
  ], [categories]);

  return {
    categories: allCategories,
    loading,
    error
  };
};
