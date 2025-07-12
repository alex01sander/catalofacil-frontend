import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Produto {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  is_active: boolean;
  image: string | null;
  images: string[];
  category_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface Categoria {
  id: string;
  name: string;
  color: string | null;
  image: string | null;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
  store_id: string | null;
}

export function useLojaPublica() {
  const [userId, setUserId] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const domain = window.location.hostname;

      // 1. Buscar o dono do domínio
      const { data: dono, error: erroDono } = await supabase
        .from('domain_owners')
        .select('user_id')
        .eq('domain', domain)
        .maybeSingle();

      if (!dono?.user_id || erroDono) {
        setLoading(false);
        return;
      }

      setUserId(dono.user_id);

      // 2. Buscar produtos públicos
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', dono.user_id)
        .eq('is_active', true);

      setProdutos(prods || []);

      // 3. Buscar categorias públicas
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', dono.user_id);

      setCategorias(cats || []);
      setLoading(false);
    };

    load();
  }, []);

  return { userId, produtos, categorias, loading };
} 