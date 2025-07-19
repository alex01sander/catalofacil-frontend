
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
    if (authLoading) {
      setLoading(true);
      return;
    }
    
    // Se não está habilitado, para de carregar
    if (!enabled) {
      setLoading(false);
      return;
    }
    
    // Se há usuário logado (AdminDashboard), faz a requisição mesmo sem token explícito
    // O interceptor do axiosInstance vai adicionar o token automaticamente
    if (!user && !token) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const url = categoryId && categoryId !== "todos" 
      ? `/products?category_id=${categoryId}` 
      : "/products";
      
    api.get(url)
      .then(res => {
        console.log('Produtos carregados com sucesso:', res.data);
        
        // Tratar tanto array vazio quanto array com dados
        if (Array.isArray(res.data)) {
          setProducts(res.data);
          setLoading(false); // Sempre parar loading quando receber resposta válida
        } else {
          console.error('res.data não é um array:', res.data);
          setProducts([]);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Erro ao carregar produtos:', err);
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

  return {
    products: filteredProducts,
    loading,
    error
  };
};
