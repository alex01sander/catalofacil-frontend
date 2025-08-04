
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
    console.log('[useOptimizedCategories] === INICIANDO BUSCA DE CATEGORIAS ===');
    console.log('[useOptimizedCategories] User:', user);
    console.log('[useOptimizedCategories] Token:', token);
    console.log('[useOptimizedCategories] AuthLoading:', authLoading);
    console.log('[useOptimizedCategories] Enabled:', enabled);
    
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
      console.log('[useOptimizedCategories] Buscando categorias na URL: /categorias');
      console.log('[useOptimizedCategories] Headers da requisição:', api.defaults.headers);
      
      const res = await api.get('/categorias');
      
      console.log('[useOptimizedCategories] Resposta da API:', res.data);
      console.log('[useOptimizedCategories] Status da resposta:', res.status);
      
      let categoriesData = [];
      // Verificar se é resposta paginada ou array direto
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        categoriesData = res.data.data;
        console.log('[useOptimizedCategories] Dados paginados encontrados');
      } else if (Array.isArray(res.data)) {
        categoriesData = res.data;
        console.log('[useOptimizedCategories] Array direto encontrado');
      } else {
        categoriesData = [];
        console.log('[useOptimizedCategories] Nenhum dado encontrado');
      }
      
      console.log('[useOptimizedCategories] Categorias processadas:', categoriesData);
      
      // Atualizar cache global
      globalCategoriesCache.data = categoriesData;
      globalCategoriesCache.timestamp = now;
      
      setCategories(categoriesData);
      console.log(`[useOptimizedCategories] ✅ ${categoriesData.length} categorias carregadas`);
      
    } catch (err) {
      console.error('[useOptimizedCategories] ❌ Erro ao carregar categorias:', err);
      console.error('[useOptimizedCategories] Detalhes do erro:', err.response?.data);
      console.error('[useOptimizedCategories] Status do erro:', err.response?.status);
      console.error('[useOptimizedCategories] Headers do erro:', err.response?.headers);
      setError(err);
      setCategories([]);
    } finally {
      setLoading(false);
      globalCategoriesCache.isFetching = false;
    }
  };

  useEffect(() => {
    console.log('[useOptimizedCategories] useEffect executado');
    console.log('[useOptimizedCategories] authLoading:', authLoading);
    console.log('[useOptimizedCategories] enabled:', enabled);
    console.log('[useOptimizedCategories] user:', user);
    console.log('[useOptimizedCategories] token:', token);
    
    if (authLoading) {
      console.log('[useOptimizedCategories] Auth ainda carregando, aguardando...');
      setLoading(true);
      return;
    }
    
    if (!enabled) {
      console.log('[useOptimizedCategories] Hook desabilitado');
      setLoading(false);
      return;
    }
    
    if (!user && !token) {
      console.log('[useOptimizedCategories] ❌ Sem usuário ou token, não buscando categorias');
      setLoading(false);
      return;
    }
    
    console.log('[useOptimizedCategories] ✅ Condições atendidas, iniciando busca...');
    
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
