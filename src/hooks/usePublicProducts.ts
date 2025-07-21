import { useEffect, useState } from "react";
import api from "@/services/api";

export function usePublicProducts(slug: string) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.get(`/site/public/${slug}/products`)
      .then(res => setProducts(res.data))
      .finally(() => setLoading(false));
  }, [slug]);

  return { products, loading };
} 