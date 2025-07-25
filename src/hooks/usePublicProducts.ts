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
        
        // Log detalhado da estrutura de cada produto
        if (res.data && res.data.length > 0) {
          console.log('[usePublicProducts] ESTRUTURA DO PRIMEIRO PRODUTO:', JSON.stringify(res.data[0], null, 2));
          res.data.forEach((product, index) => {
            console.log(`[usePublicProducts] Produto ${index + 1}:`, {
              id: product.id,
              name: product.name,
              category_id: product.category_id,
              category: product.category,
              categories: product.categories
            });
          });
        }
        
        // Verificar se é resposta paginada ou array direto
        if (res.data && res.data.data && Array.isArray(res.data.data)) {
          setProducts(res.data.data);
        } else if (Array.isArray(res.data)) {
          setProducts(res.data);
        } else {
          setProducts([]);
        }
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