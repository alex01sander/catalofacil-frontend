
import { useState, useEffect, useMemo, useRef } from "react";
import api from "@/services/api";
import { API_URL } from "@/constants/api";
import { useAuth } from '@/contexts/AuthContext';

export const useOptimizedCategories = (enabled = true) => {
  const { token, loading: authLoading, user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Cache para evitar requisições desnecessárias
  const lastFetchTime = useRef(0);
  const isFetching = useRef(false);

  const fetchCategories = async () => {
    // Evitar múltiplas requisições simultâneas
    if (isFetching.current) {
      console.log('[useOptimizedCategories] Já está buscando categorias, aguardando...');
      return;
    }

    // Cache de 60 segundos para evitar requisições excessivas
    const now = Date.now();
    if (now - lastFetchTime.current < 60000 && categories.length > 0) {
      console.log('[useOptimizedCategories] Categorias em cache, usando dados existentes');
      return;
    }

    setLoading(true);
    setError(null);
    isFetching.current = true;
    
    try {
      console.log('[useOptimizedCategories] Buscando categorias...');
      const res = await api.get('/categorias');
      
      // Verificar se é resposta paginada ou array direto
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        setCategories(res.data.data);
      } else if (Array.isArray(res.data)) {
        setCategories(res.data);
      } else {
        setCategories([]);
      }
      
      lastFetchTime.current = now;
      console.log(`[useOptimizedCategories] ✅ ${categories.length} categorias carregadas`);
      
    } catch (err) {
      console.error('[useOptimizedCategories] Erro ao carregar categorias:', err);
      setError(err);
      setCategories([]);
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
    
    fetchCategories();
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
