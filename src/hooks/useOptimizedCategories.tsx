
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
    
    api.get(`/categorias`)
      .then(res => {
        console.log('Categorias carregadas com sucesso:', res.data);
        setCategories(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar categorias:', err);
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
