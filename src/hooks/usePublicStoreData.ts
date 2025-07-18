import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "@/constants/api";
import { useAuth } from '@/contexts/AuthContext';

export function usePublicStoreData() {
  const { token } = useAuth();
  const [storeData, setStoreData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const storeRes = await axios.get(`${API_URL}/storeSettings`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        setStoreData(storeRes.data || null);
        if (!token) throw new Error('Usuário não autenticado');
        const prodsRes = await axios.get(`${API_URL}/products`, { headers: { Authorization: `Bearer ${token}` } });
        setProducts(prodsRes.data || []);
      } catch (err) {
        setError('Erro ao carregar dados da loja (autenticação obrigatória)');
        setStoreData(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  return { storeData, products, loading, error };
} 