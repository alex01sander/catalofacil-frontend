import { useEffect, useState } from "react";
import api from "@/services/api";

export function usePublicCategories(slug: string) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.get(`/site/${slug}/categories`)
      .then(res => {
        // Verificar se é resposta paginada ou array direto
        if (res.data && res.data.data && Array.isArray(res.data.data)) {
          setCategories(res.data.data);
        } else if (Array.isArray(res.data)) {
          setCategories(res.data);
        } else {
          setCategories([]);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  return { categories, loading };
} 