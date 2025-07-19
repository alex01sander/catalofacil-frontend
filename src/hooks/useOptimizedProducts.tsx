
import { useState, useEffect, useMemo } from "react";
import api from "@/services/api";
import { API_URL } from "@/constants/api";
import { useAuth } from '@/contexts/AuthContext';

export const useOptimizedProducts = (categoryId = null, enabled = true) => {
  const { token, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
    const url = categoryId && categoryId !== "todos" 
      ? `/products?category_id=${categoryId}` 
      : "/products";
    api.get(url)
      .then(res => {
        setProducts(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [categoryId, enabled, token, authLoading]);

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
