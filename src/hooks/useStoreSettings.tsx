
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StoreSettings {
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

export const useStoreSettings = () => {
  const fetchStoreSettings = async (): Promise<StoreSettings | null> => {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching store settings:', error);
      // Return default settings if no settings found
      return {
        id: '',
        store_name: 'Minha Loja',
        store_description: 'Catálogo de produtos',
        store_subtitle: 'Produtos Incríveis',
        mobile_logo: null,
        mobile_banner_color: 'verde',
        mobile_banner_image: null,
        desktop_banner: null,
        whatsapp_number: '5511999999999',
        instagram_url: 'https://instagram.com/',
        user_id: '',
        created_at: '',
        updated_at: ''
      };
    }

    return data;
  };

  const {
    data: settings,
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ['store_settings'],
    queryFn: fetchStoreSettings,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  return {
    settings: settings || {
      id: '',
      store_name: 'Minha Loja',
      store_description: 'Catálogo de produtos',
      store_subtitle: 'Produtos Incríveis',
      mobile_logo: null,
      mobile_banner_color: 'verde',
      mobile_banner_image: null,
      desktop_banner: null,
      whatsapp_number: '5511999999999',
      instagram_url: 'https://instagram.com/',
      user_id: '',
      created_at: '',
      updated_at: ''
    },
    loading,
    error
  };
};
