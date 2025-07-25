
import { useState, useEffect, useMemo } from "react";
import api from "@/services/api";
import { API_URL } from "@/constants/api";
import { useAuth } from '@/contexts/AuthContext';

export const useOptimizedProducts = (categoryId = null, enabled = true) => {
  const { token, loading: authLoading, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para buscar produtos (pode ser chamada sob demanda)
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    const url = categoryId && categoryId !== "todos" 
      ? `/products?category_id=${categoryId}` 
      : "/products";
    try {
      const res = await api.get(url);
      // Verificar se é resposta paginada ou array direto
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        setProducts(res.data.data);
      } else if (Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      setError(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Mantém logs de debug
    console.log('=== useOptimizedProducts DEBUG ===');
    console.log('Token:', token);
    console.log('authLoading:', authLoading);
    console.log('user:', user);
    console.log('enabled:', enabled);
    console.log('categoryId:', categoryId);
    console.log('loading state:', loading);

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
    if (!enabled) {
      console.log('Hook desabilitado, parando loading');
      setLoading(false);
      return;
    }
    
    // Se há usuário logado (AdminDashboard), faz a requisição mesmo sem token explícito
    // O interceptor do axiosInstance vai adicionar o token automaticamente
    if (!user && !token) {
      console.log('Sem usuário nem token, parando loading');
      setLoading(false);
      return;
    }
    
    console.log('Iniciando requisição para produtos...');
    setLoading(true);
    setError(null);
    
    const url = categoryId && categoryId !== "todos" 
      ? `/products?category_id=${categoryId}` 
      : "/products";
      
    console.log('URL da requisição:', url);
    
    api.get(url)
      .then(res => {
        console.log('=== RESPOSTA DO SERVIDOR (PRODUTOS) ===');
        console.log('Status:', res.status);
        console.log('Data:', res.data);
        console.log('Tipo de res.data:', typeof res.data);
        
        // Verificar se é resposta paginada ou array direto
        if (res.data && res.data.data && Array.isArray(res.data.data)) {
          console.log('✅ Resposta paginada válida recebida');
          console.log('Produtos:', res.data.data);
          console.log('Tamanho do array:', res.data.data.length);
          setProducts(res.data.data);
          setLoading(false);
        } else if (Array.isArray(res.data)) {
          console.log('✅ Array direto válido recebido');
          console.log('Tamanho do array:', res.data.length);
          setProducts(res.data);
          setLoading(false);
        } else {
          console.error('❌ Formato de resposta inválido:', res.data);
          setProducts([]);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('❌ Erro ao carregar produtos:', err);
        setError(err);
        setLoading(false);
      });
  }, [categoryId, enabled, token, authLoading, user]);

  const filteredProducts = useMemo(() => {
    console.log('=== FILTRO DE PRODUTOS DEBUG ===');
    console.log('categoryId:', categoryId);
    console.log('products antes do filtro:', products);
    
    // REMOVENDO FILTRO TEMPORARIAMENTE PARA DEBUG
    // if (!categoryId || categoryId === "todos") {
    //   return products;
    // }
    // return products.filter(product => product.category_id === categoryId);
    
    console.log('Retornando TODOS os produtos sem filtro para debug');
    return products;
  }, [products, categoryId]);

  console.log('=== HOOK RETURN (PRODUTOS) ===');
  console.log('products:', filteredProducts);
  console.log('loading:', loading);
  console.log('error:', error);

  return {
    products: filteredProducts,
    loading,
    error,
    refetch: fetchProducts
  };
};
