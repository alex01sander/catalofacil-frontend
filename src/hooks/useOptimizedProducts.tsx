
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
    console.log('[useOptimizedProducts] === INICIANDO BUSCA DE PRODUTOS ===');
    console.log('[useOptimizedProducts] User:', user);
    console.log('[useOptimizedProducts] Token:', token);
    console.log('[useOptimizedProducts] AuthLoading:', authLoading);
    console.log('[useOptimizedProducts] Enabled:', enabled);
    console.log('[useOptimizedProducts] CategoryId:', categoryId);
    
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
      console.log('[useOptimizedProducts] Buscando produtos na URL:', url);
      console.log('[useOptimizedProducts] Headers da requisição:', api.defaults.headers);
      
      const res = await api.get(url);
      
      console.log('[useOptimizedProducts] Resposta da API:', res.data);
      console.log('[useOptimizedProducts] Status da resposta:', res.status);
      
      let productsData = [];
      // Verificar se é resposta paginada ou array direto
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        productsData = res.data.data;
        console.log('[useOptimizedProducts] Dados paginados encontrados');
      } else if (Array.isArray(res.data)) {
        productsData = res.data;
        console.log('[useOptimizedProducts] Array direto encontrado');
      } else {
        productsData = [];
        console.log('[useOptimizedProducts] Nenhum dado encontrado');
      }
      
      console.log('[useOptimizedProducts] Produtos processados:', productsData);
      
      // Atualizar cache global
      globalProductsCache.data = productsData;
      globalProductsCache.timestamp = now;
      
      setProducts(productsData);
      console.log(`[useOptimizedProducts] ✅ ${productsData.length} produtos carregados`);
      
    } catch (err) {
      console.error('[useOptimizedProducts] ❌ Erro na fetchProducts:', err);
      console.error('[useOptimizedProducts] Detalhes do erro:', err.response?.data);
      console.error('[useOptimizedProducts] Status do erro:', err.response?.status);
      console.error('[useOptimizedProducts] Headers do erro:', err.response?.headers);
      setError(err || new Error('Erro desconhecido'));
      setProducts([]);
    } finally {
      setLoading(false);
      globalProductsCache.isFetching = false;
    }
  };

  useEffect(() => {
    console.log('[useOptimizedProducts] useEffect executado');
    console.log('[useOptimizedProducts] authLoading:', authLoading);
    console.log('[useOptimizedProducts] enabled:', enabled);
    console.log('[useOptimizedProducts] user:', user);
    console.log('[useOptimizedProducts] token:', token);
    
    if (authLoading) {
      console.log('[useOptimizedProducts] Auth ainda carregando, aguardando...');
      setLoading(true);
      return;
    }
    
    if (!enabled) {
      console.log('[useOptimizedProducts] Hook desabilitado');
      setLoading(false);
      return;
    }
    
    if (!user && !token) {
      console.log('[useOptimizedProducts] ❌ Sem usuário ou token, não buscando produtos');
      setLoading(false);
      return;
    }
    
    console.log('[useOptimizedProducts] ✅ Condições atendidas, iniciando busca...');
    
    // Debounce para evitar múltiplas requisições
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, 1000); // 1 segundo de debounce
    
    return () => clearTimeout(timeoutId);
  }, [user, token, authLoading, enabled, categoryId]);

  // Função para forçar atualização (usada quando necessário)
  const refetch = () => {
    console.log('[useOptimizedProducts] 🔄 Forçando atualização...');
    globalProductsCache.timestamp = 0; // Forçar nova busca
    fetchProducts();
  };

  return { products, loading, error, refetch };
};
