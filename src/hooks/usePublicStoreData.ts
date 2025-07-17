import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "@/constants/api";

export function usePublicStoreData() {
  const [storeData, setStoreData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const storeRes = await axios.get(`${API_URL}/storeSettings`);
        setStoreData(storeRes.data || null);
        const prodsRes = await axios.get(`${API_URL}/produtos`);
        setProducts(prodsRes.data || []);
      } catch (err) {
        setError('Erro ao carregar dados públicos da loja');
        setStoreData(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { storeData, products, loading, error };
} 