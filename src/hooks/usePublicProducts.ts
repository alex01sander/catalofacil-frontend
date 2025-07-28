import { useEffect, useState } from "react";
import api from "@/services/api";

export function usePublicProducts(slug: string) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[usePublicProducts] useEffect executado');
    console.log('[usePublicProducts] slug recebido:', slug);
    if (!slug) {
      console.warn('[usePublicProducts] BLOQUEADO: slug está vazio ou undefined');
      setLoading(false);
      return;
    }
    setLoading(true);
    console.log('[usePublicProducts] Fazendo requisição para:', `/site/public/${slug}/products`);
    api.get(`/site/public/${slug}/products`)
      .then(res => {
        console.log('[usePublicProducts] Resposta da API:', res);
        console.log('[usePublicProducts] Produtos públicos recebidos:', res.data);
        console.log('[usePublicProducts] Quantidade de produtos:', res.data?.length);
        
        // Verificar se é resposta paginada ou array direto
        let productsData = [];
        if (res.data && res.data.data && Array.isArray(res.data.data)) {
          productsData = res.data.data;
        } else if (Array.isArray(res.data)) {
          productsData = res.data;
        } else {
          productsData = [];
        }

        // Normalizar dados dos produtos para garantir tipos corretos
        const normalizedProducts = productsData.map(product => ({
          ...product,
          stock: typeof product.stock === 'number' ? product.stock : 0,
          price: typeof product.price === 'number' ? product.price : 0,
          is_active: product.is_active === true || product.is_active === 'true',
          images: Array.isArray(product.images) ? product.images : [],
          category_id: product.category_id || null
        }));
        
        setProducts(normalizedProducts);
      })
      .catch(error => {
        console.error('[usePublicProducts] Erro ao buscar produtos:', error);
        console.error('[usePublicProducts] error.response:', error.response);
        setProducts([]);
      })
      .finally(() => {
        console.log('[usePublicProducts] Finalizando loading');
        setLoading(false);
      });
  }, [slug]);

  console.log('[usePublicProducts] RETURN - products:', products);
  console.log('[usePublicProducts] RETURN - loading:', loading);
  return { products, loading };
} 