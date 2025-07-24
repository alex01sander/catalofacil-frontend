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
        setProducts(res.data || []);
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