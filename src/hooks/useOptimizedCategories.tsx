
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_URL } from "@/constants/api";

export const useOptimizedCategories = (enabled = true) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    axios.get(`${API_URL}/categorias`)
      .then(res => {
        setCategories(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [enabled]);

  const allCategories = useMemo(() => [
    {
      id: "todos",
      name: "Todos",
      image: "https://static.vecteezy.com/ti/vetor-gratis/p1/453289-vitrine-de-brinquedos-vetor.jpg"
    },
    ...categories
  ], [categories]);

  return {
    categories: allCategories,
    loading,
    error
  };
};
