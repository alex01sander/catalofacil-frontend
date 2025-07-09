
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
    try {
      // Buscar o proprietário do domínio atual
      const { data: domainOwner, error: domainError } = await supabase
        .rpc('get_current_domain_owner');
      
      if (domainError) {
        console.error('Error getting domain owner:', domainError);
        return defaultSettings;
      }
      
      // Se não encontrou proprietário do domínio, usar configurações padrão
      if (!domainOwner) {
        return defaultSettings;
      }
      
      // Buscar configurações da loja do proprietário do domínio
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('user_id', domainOwner)
        .maybeSingle();

      if (error) {
        console.error('Error fetching store settings:', error);
        return defaultSettings;
      }

      return data || defaultSettings;
    } catch (error) {
      console.error('Error in fetchStoreSettings:', error);
      return defaultSettings;
    }
  };

  const {
    data: settings = defaultSettings,
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ['store-settings-public'],
    queryFn: fetchStoreSettings,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<StoreSettings>) => {
      // Buscar o proprietário do domínio atual para validar permissão de edição
      const { data: domainOwner, error: domainError } = await supabase
        .rpc('get_current_domain_owner');
      
      if (domainError) {
        throw new Error('Erro ao identificar proprietário do domínio');
      }
      
      if (!domainOwner) {
        throw new Error('Domínio não encontrado');
      }
      
      // Verificar se o usuário logado é o proprietário do domínio
      if (!user || user.id !== domainOwner) {
        throw new Error('Você não tem permissão para editar as configurações desta loja');
      }
      
      const { error } = await supabase
        .from('store_settings')
        .update(newSettings)
        .eq('user_id', domainOwner);

      if (error) throw error;
      
      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-settings-public'] });
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
