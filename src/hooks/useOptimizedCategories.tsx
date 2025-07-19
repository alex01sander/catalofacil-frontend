
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_URL } from "@/constants/api";
import { useAuth } from '@/contexts/AuthContext';

export const useOptimizedCategories = (enabled = true) => {
  const { token, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Token no hook useOptimizedCategories:', token);
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!enabled || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    axios.get(`${API_URL}/categorias`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setCategories(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [enabled, token, authLoading]);

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
