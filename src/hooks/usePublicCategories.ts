import { useEffect, useState } from "react";
import api from "@/services/api";

export function usePublicCategories(slug: string) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    
    console.log('[usePublicCategories] Buscando categorias para slug:', slug);
    
    api.get(`/site/public/${slug}/categories`)
      .then(res => {
        console.log('[usePublicCategories] Resposta da API:', res.data);
        
        // Verificar se é resposta paginada ou array direto
        let categoriesData = [];
        if (res.data && res.data.data && Array.isArray(res.data.data)) {
          categoriesData = res.data.data;
        } else if (Array.isArray(res.data)) {
          categoriesData = res.data;
        } else {
          categoriesData = [];
        }
        
        console.log('[usePublicCategories] Categorias encontradas:', categoriesData);
        setCategories(categoriesData);
      })
      .catch(error => {
        console.error('[usePublicCategories] Erro ao buscar categorias:', error);
        console.error('[usePublicCategories] Detalhes do erro:', error.response?.data);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  return { categories, loading };
} 