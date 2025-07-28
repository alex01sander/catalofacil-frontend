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

        // Log dos dados originais antes da normalização
        if (productsData.length > 0) {
          console.log('[usePublicProducts] DADOS ORIGINAIS DO PRIMEIRO PRODUTO:', JSON.stringify(productsData[0], null, 2));
          productsData.forEach((product, index) => {
            console.log(`[usePublicProducts] Produto ${index + 1} original:`, {
              id: product.id,
              name: product.name,
              stock: product.stock,
              price: product.price,
              is_active: product.is_active,
              category_id: product.category_id,
              category: product.category,
              categories: product.categories
            });
          });
        }

        // Normalizar dados dos produtos para garantir tipos corretos
        const normalizedProducts = productsData.map(product => {
          // Preservar valores originais quando válidos
          const normalizedProduct = {
            ...product,
            stock: product.stock !== null && product.stock !== undefined ? Number(product.stock) : 0,
            price: product.price !== null && product.price !== undefined ? Number(product.price) : 0,
            is_active: product.is_active === true || product.is_active === 'true' || product.is_active === 1,
            images: Array.isArray(product.images) ? product.images : (product.image ? [product.image] : []),
            category_id: product.category_id || null
          };

          // Log da normalização para debug
          console.log(`[usePublicProducts] Normalização do produto ${product.name}:`, {
            original: { stock: product.stock, price: product.price, is_active: product.is_active },
            normalized: { stock: normalizedProduct.stock, price: normalizedProduct.price, is_active: normalizedProduct.is_active }
          });

          return normalizedProduct;
        });
        
        // Log detalhado da estrutura de cada produto normalizado
        if (normalizedProducts.length > 0) {
          console.log('[usePublicProducts] ESTRUTURA DO PRIMEIRO PRODUTO NORMALIZADO:', JSON.stringify(normalizedProducts[0], null, 2));
          normalizedProducts.forEach((product, index) => {
            console.log(`[usePublicProducts] Produto ${index + 1} normalizado:`, {
              id: product.id,
              name: product.name,
              stock: product.stock,
              price: product.price,
              is_active: product.is_active,
              category_id: product.category_id,
              category: product.category,
              categories: product.categories
            });
          });
        }
        
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