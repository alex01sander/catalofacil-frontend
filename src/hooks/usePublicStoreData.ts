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
          // Tentar múltiplas variações do domínio para garantir compatibilidade
          const currentHost = window.location.host; // inclui porta se houver
          const currentHostname = window.location.hostname; // só o hostname
          
          console.log('🔍 Tentando encontrar domínio:', { currentHost, currentHostname });
          
          // Buscar o user_id do dono do domínio - tentar várias combinações
          let owner = null;
          let ownerError = null;
          
          // Primeira tentativa: host completo
          const { data: owner1, error: ownerError1 } = await supabase
            .from('domain_owners')
            .select('user_id')
            .eq('domain', currentHost)
            .maybeSingle();
          
          if (owner1?.user_id) {
            owner = owner1;
          } else {
            // Segunda tentativa: apenas hostname
            const { data: owner2, error: ownerError2 } = await supabase
              .from('domain_owners')
              .select('user_id')
              .eq('domain', currentHostname)
              .maybeSingle();
            
            if (owner2?.user_id) {
              owner = owner2;
            } else {
              // Terceira tentativa: verificar se há algum domínio que contenha parte do atual
              const { data: allDomains, error: allDomainsError } = await supabase
                .from('domain_owners')
                .select('domain, user_id');
              
              if (allDomains && !allDomainsError) {
                console.log('🔍 Todos os domínios disponíveis:', allDomains);
                
                // Procurar por domínio que contenha o hostname atual
                const matchingDomain = allDomains.find(d => 
                  d.domain.includes(currentHostname) || 
                  currentHostname.includes(d.domain) ||
                  d.domain === currentHost
                );
                
                if (matchingDomain) {
                  owner = { user_id: matchingDomain.user_id };
                  console.log('🎯 Domínio encontrado:', matchingDomain);
                }
              }
              
              ownerError = ownerError2 || ownerError1;
            }
          }
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