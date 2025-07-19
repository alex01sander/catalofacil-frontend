
import { useState, useEffect, useMemo } from "react";
import api from "@/services/api";
import { API_URL } from "@/constants/api";
import { useAuth } from '@/contexts/AuthContext';

export const useOptimizedProducts = (categoryId = null, enabled = true) => {
  const { token, loading: authLoading, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('=== useOptimizedProducts DEBUG ===');
    console.log('Token:', token);
    console.log('authLoading:', authLoading);
    console.log('user:', user);
    console.log('enabled:', enabled);
    console.log('categoryId:', categoryId);
    console.log('loading state:', loading);
    
    if (authLoading) {
      console.log('Auth ainda carregando, aguardando...');
      setLoading(true);
      return;
    }
    
    // Se não está habilitado, para de carregar
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
        console.log('É array?', Array.isArray(res.data));
        console.log('Tamanho do array:', Array.isArray(res.data) ? res.data.length : 'N/A');
        
        // Tratar tanto array vazio quanto array com dados
        if (Array.isArray(res.data)) {
          console.log('✅ Array válido recebido, definindo produtos e parando loading');
          setProducts(res.data);
          setLoading(false); // Sempre parar loading quando receber resposta válida
        } else {
          console.error('❌ res.data não é um array:', res.data);
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
    if (!categoryId || categoryId === "todos") {
      return products;
    }
    return products.filter(product => product.category_id === categoryId);
  }, [products, categoryId]);

  console.log('=== HOOK RETURN (PRODUTOS) ===');
  console.log('products:', filteredProducts);
  console.log('loading:', loading);
  console.log('error:', error);

  return {
    products: filteredProducts,
    loading,
    error
  };
};
