import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StoreSettings {
  id: string;
  store_name: string;
  store_description: string;
  store_subtitle: string;
  mobile_logo: string | null;
  mobile_banner_color: string;
  mobile_banner_image: string | null;
  desktop_banner: string | null;
  whatsapp_number: string;
  instagram_url: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface Product {
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

interface UsePublicStoreDataResult {
  storeData: StoreSettings | null;
  products: Product[];
  loading: boolean;
  error: string | null;
}

export function usePublicStoreData(): UsePublicStoreDataResult {
  const [storeData, setStoreData] = useState<StoreSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const domain = window.location.hostname;
        // Buscar o user_id do dono do domínio
        const { data: owner, error: ownerError } = await supabase
          .from('domain_owners')
          .select('user_id')
          .eq('domain', domain)
          .maybeSingle();
        if (ownerError) throw new Error(ownerError.message);
        if (!owner?.user_id) {
          setStoreData(null);
          setProducts([]);
          setLoading(false);
          return;
        }
        // Buscar dados da loja
        const { data: store, error: storeError } = await supabase
          .from('store_settings')
          .select('*')
          .eq('user_id', owner.user_id)
          .maybeSingle();
        if (storeError) throw new Error(storeError.message);
        // Buscar produtos ativos
        const { data: prods, error: prodsError } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', owner.user_id)
          .eq('is_active', true);
        if (prodsError) throw new Error(prodsError.message);
        setStoreData(store || null);
        setProducts(prods || []);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados públicos da loja');
        setStoreData(null);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { storeData, products, loading, error };
} 