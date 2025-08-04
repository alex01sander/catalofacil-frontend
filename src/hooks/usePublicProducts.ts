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
    
    console.log('[usePublicProducts] Buscando produtos para slug:', slug);
    
    api.get(`/site/public/${slug}/products`)
      .then(res => {
        console.log('[usePublicProducts] Resposta da API:', res.data);
        
        // Verificar se é resposta paginada ou array direto
        let productsData = [];
        if (res.data && res.data.data && Array.isArray(res.data.data)) {
          productsData = res.data.data;
        } else if (Array.isArray(res.data)) {
          productsData = res.data;
        } else {
          productsData = [];
        }

        console.log('[usePublicProducts] Produtos brutos:', productsData);

        // Normalizar dados dos produtos - preservar valores originais quando válidos
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
        
        console.log('[usePublicProducts] Produtos normalizados:', normalizedProducts);
        setProducts(normalizedProducts);
      })
      .catch(error => {
        console.error('[usePublicProducts] Erro ao buscar produtos:', error);
        console.error('[usePublicProducts] Detalhes do erro:', error.response?.data);
        setProducts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  return { products, loading };
} 