
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
    console.log('Token no hook useOptimizedCategories:', token, 'authLoading:', authLoading, 'user:', user);
    
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
    
    console.log('Fazendo requisição para /categorias...');
    
    api.get(`/categorias`)
      .then(res => {
        console.log('Resposta completa do servidor:', res);
        console.log('Tipo de res.data:', typeof res.data);
        console.log('res.data é array?', Array.isArray(res.data));
        console.log('Categorias carregadas com sucesso:', res.data);
        
        // Verificar se res.data é um array válido
        if (Array.isArray(res.data)) {
          setCategories(res.data);
        } else {
          console.error('res.data não é um array:', res.data);
          setCategories([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar categorias:', err);
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

  return {
    categories: allCategories,
    loading,
    error
  };
};
