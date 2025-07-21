import { useEffect, useState } from "react";
import api from "@/services/api";

export function usePublicCategories(slug: string) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.get(`/site/public/${slug}/categories`)
      .then(res => setCategories(res.data))
      .finally(() => setLoading(false));
  }, [slug]);

  return { categories, loading };
} 