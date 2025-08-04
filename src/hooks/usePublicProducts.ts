import { useEffect, useState } from "react";
import api from "@/services/api";

export function usePublicProducts(slug: string) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    
    api.get(`/site/${slug}/products`)
      .then(res => {
        // Verificar se é resposta paginada ou array direto
        let productsData = [];
        if (res.data && res.data.data && Array.isArray(res.data.data)) {
          productsData = res.data.data;
        } else if (Array.isArray(res.data)) {
          productsData = res.data;
        } else {
          productsData = [];
        }

        // Normalizar dados dos produtos - agora que a API retorna os campos corretos
        const normalizedProducts = productsData.map(product => ({
          ...product,
          stock: Number(product.stock) || 0,
          price: Number(product.price) || 0,
          is_active: Boolean(product.is_active),
          images: Array.isArray(product.images) ? product.images : [],
          category_id: product.category_id || null
        }));
        
        setProducts(normalizedProducts);
      })
      .catch(error => {
        console.error('[usePublicProducts] Erro ao buscar produtos:', error);
        setProducts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  return { products, loading };
} 