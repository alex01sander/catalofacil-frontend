
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

const defaultSettings: StoreSettings = {
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

export const useStoreSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchStoreSettings = async (): Promise<StoreSettings> => {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching store settings:', error);
      return defaultSettings;
    }

    return data || defaultSettings;
  };

  const {
    data: settings = defaultSettings,
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ['store_settings'],
    queryFn: fetchStoreSettings,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<StoreSettings>) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('store_settings')
        .update(newSettings)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store_settings'] });
    }
  });

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    return updateSettingsMutation.mutateAsync(newSettings);
  };

  return {
    settings,
    loading,
    error,
    updateSettings
  };
};
