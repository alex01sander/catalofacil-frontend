
import { useState, useEffect, useMemo } from "react";
import api from "@/services/api";
import { API_URL } from "@/constants/api";
import { useAuth } from '@/contexts/AuthContext';

export const useOptimizedCategories = (enabled = true) => {
  const { token, loading: authLoading, user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('=== useOptimizedCategories DEBUG ===');
    console.log('Token:', token);
    console.log('authLoading:', authLoading);
    console.log('user:', user);
    console.log('enabled:', enabled);
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
    
    console.log('Iniciando requisição para /categorias...');
    setLoading(true);
    setError(null);
    
    api.get(`/categorias`)
      .then(res => {
        console.log('=== RESPOSTA DO SERVIDOR ===');
        console.log('Status:', res.status);
        console.log('Headers:', res.headers);
        console.log('Data:', res.data);
        console.log('Tipo de res.data:', typeof res.data);
        console.log('É array?', Array.isArray(res.data));
        console.log('Tamanho do array:', Array.isArray(res.data) ? res.data.length : 'N/A');
        
        // Tratar tanto array vazio quanto array com dados
        if (Array.isArray(res.data)) {
          console.log('✅ Array válido recebido, definindo categorias e parando loading');
          setCategories(res.data);
          setLoading(false); // Sempre parar loading quando receber resposta válida
        } else {
          console.error('❌ res.data não é um array:', res.data);
          setCategories([]);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('❌ Erro ao carregar categorias:', err);
        console.error('Detalhes do erro:', err.response?.data);
        setError(err);
        setLoading(false);
      });
  }, [enabled, token, authLoading, user]);

  const allCategories = useMemo(() => [
    {
      id: "todos",
      name: "Todos",
      image: "https://static.vecteezy.com/ti/vetor-gratis/p1/453289-vitrine-de-brinquedos-vetor.jpg"
    },
    ...categories
  ], [categories]);

  console.log('=== HOOK RETURN ===');
  console.log('categories:', allCategories);
  console.log('loading:', loading);
  console.log('error:', error);

  return {
    categories: allCategories,
    loading,
    error
  };
};
