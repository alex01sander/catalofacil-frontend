import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "@/constants/api";

export function useLojaPublica(slug?: string) {
  const [userId, setUserId] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Buscar produtos públicos
      if (slug) {
        const prodsRes = await axios.get(`${API_URL}/site/${slug}`);
        setProdutos(prodsRes.data.products || []);
      } else {
        setProdutos([]);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  return { userId, produtos, categorias, loading };
} 