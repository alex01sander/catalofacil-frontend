
import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "@/constants/api";
import { useAuth } from '@/contexts/AuthContext';

export const useOptimizedProducts = ({
  searchTerm = '',
  selectedCategory = 'todos',
  enabled = true,
  publicView = false,
  token: propToken = null
} = {}) => {
  const { token: contextToken } = useAuth();
  const token = propToken || contextToken;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    if (!publicView && !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const headers = publicView ? {} : { Authorization: `Bearer ${token}` };
    axios.get(`${API_URL}/products`, { headers })
      .then(res => {
        let filtered = res.data;
        if (selectedCategory && selectedCategory !== 'todos') {
          filtered = filtered.filter(p => p.category_id === selectedCategory);
        }
        if (searchTerm.trim()) {
          filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        setProducts(filtered);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [searchTerm, selectedCategory, enabled, token, publicView]);

  return {
    products,
    loading,
    error,
    refetch: () => {},
  };
};
