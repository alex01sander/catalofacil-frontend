
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
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar o proprietário do domínio atual
      const { data: domainOwner, error: domainError } = await supabase
        .rpc('get_current_domain_owner');
      
      if (domainError) {
        console.error('Error getting domain owner:', domainError);
        throw new Error('Erro ao identificar proprietário do domínio');
      }
      
      // Para localhost ou quando não há domínio específico, usar o usuário atual
      const targetUserId = domainOwner || user.id;
      
      // Verificar se o usuário logado é o proprietário do domínio
      if (user.id !== targetUserId) {
        throw new Error('Você não tem permissão para editar as configurações desta loja');
      }
      
      // Primeiro tentar atualizar, se não existir, criar
      const { data: existingSettings } = await supabase
        .from('store_settings')
        .select('id')
        .eq('user_id', targetUserId)
        .maybeSingle();

      let result;
      if (existingSettings) {
        // Atualizar existente
        result = await supabase
          .from('store_settings')
          .update(newSettings)
          .eq('user_id', targetUserId);
      } else {
        // Criar novo
        result = await supabase
          .from('store_settings')
          .insert({
            ...newSettings,
            user_id: targetUserId
          });
      }

      if (result.error) {
        console.error('Error saving store settings:', result.error);
        throw new Error('Erro ao salvar configurações: ' + result.error.message);
      }
      
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
