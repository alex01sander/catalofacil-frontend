import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StoreSettings {
  id?: string;
  store_name: string;
  store_description: string;
  store_subtitle: string;
  instagram_url: string;
  whatsapp_number: string;
  mobile_logo: string | null;
  desktop_banner: string | null;
  mobile_banner_color: string;
  mobile_banner_image: string | null;
}

interface StoreSettingsContextType {
  settings: StoreSettings;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  refetch: () => Promise<void>;
}

const defaultSettings: StoreSettings = {
  store_name: 'Minha Loja',
  store_description: 'Bem-vindo à minha loja!\nAqui você encontra os melhores produtos.',
  store_subtitle: 'Produtos Incríveis',
  instagram_url: 'https://instagram.com/',
  whatsapp_number: '5511999999999',
  mobile_logo: null,
  desktop_banner: null,
  mobile_banner_color: 'verde',
  mobile_banner_image: null
};

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

export const useStoreSettings = () => {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider');
  }
  return context;
};

interface StoreSettingsProviderProps {
  children: ReactNode;
}

export const StoreSettingsProvider = ({ children }: StoreSettingsProviderProps) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchStoreSettings = async (useCache = true) => {
    try {
      setError(null);
      
      console.log('🔍 Debug Context: Fetching store settings');
      console.log('🔍 Debug Context: Current user:', user?.id);
      
      // Buscar o proprietário do domínio atual
      const { data: domainOwner, error: domainError } = await supabase
        .rpc('get_current_domain_owner');
      
      console.log('🔍 Debug Context: Domain owner fetch result:', { domainOwner, domainError });
      
      if (domainError) {
        console.error('Error getting domain owner:', domainError);
        setSettings(defaultSettings);
        setLoading(false);
        return;
      }
      
      // Para localhost, usar o usuário atual se não há proprietário específico
      const targetUserId = domainOwner || user?.id;
      console.log('🔍 Debug Context: Target user for fetch:', targetUserId);
      
      // Se não temos um usuário alvo, usar configurações padrão
      if (!targetUserId) {
        console.log('🔍 Debug Context: No target user, using default settings');
        setSettings(defaultSettings);
        setLoading(false);
        return;
      }
      
      // Buscar configurações da loja do usuário alvo
      const { data, error: fetchError } = await supabase
        .from('store_settings')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();
      
      console.log('🔍 Debug Context: Store settings query result:', { data, fetchError });

      if (fetchError) {
        console.error('Error fetching store settings:', fetchError);
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      if (data) {
        const newSettings: StoreSettings = {
          id: data.id,
          store_name: data.store_name,
          store_description: data.store_description,
          store_subtitle: data.store_subtitle ?? 'Produtos Incríveis',
          instagram_url: data.instagram_url ?? 'https://instagram.com/',
          whatsapp_number: data.whatsapp_number ?? '5511999999999',
          mobile_logo: data.mobile_logo,
          desktop_banner: data.desktop_banner,
          mobile_banner_color: data.mobile_banner_color || 'verde',
          mobile_banner_image: data.mobile_banner_image
        };
        setSettings(newSettings);
      } else {
        // Se não há dados, retornar configurações padrão para o proprietário configurar
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error fetching store settings:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    try {
      setError(null);

      console.log('🔍 Debug Context: Iniciando salvamento das configurações');
      console.log('🔍 Debug Context: User ID:', user.id);
      console.log('🔍 Debug Context: Settings to save:', newSettings);
      
      // Buscar o proprietário do domínio atual
      const { data: domainOwner, error: domainError } = await supabase
        .rpc('get_current_domain_owner');
      
      console.log('🔍 Debug Context: Domain owner result:', { domainOwner, domainError });
      
      if (domainError) {
        console.error('Error getting domain owner:', domainError);
        throw new Error('Erro ao identificar proprietário do domínio');
      }
      
      // Para localhost ou quando não há domínio específico, usar o usuário atual
      const targetUserId = domainOwner || user.id;
      console.log('🔍 Debug Context: Target user ID:', targetUserId);
      
      // Verificar se o usuário logado é o proprietário do domínio
      if (user.id !== targetUserId) {
        throw new Error('Você não tem permissão para editar as configurações desta loja');
      }

      // Filtrar apenas os campos válidos para salvar
      const { id, ...settingsToSave } = newSettings;
      console.log('🔍 Debug Context: Settings after cleanup:', settingsToSave);

      // Primeiro tentar atualizar, se não existir, criar
      const { data: existingSettings } = await supabase
        .from('store_settings')
        .select('id')
        .eq('user_id', targetUserId)
        .maybeSingle();

      let result;
      if (existingSettings) {
        // Atualizar existente
        console.log('🔍 Debug Context: Updating existing settings');
        result = await supabase
          .from('store_settings')
          .update(settingsToSave)
          .eq('user_id', targetUserId);
      } else {
        // Criar novo
        console.log('🔍 Debug Context: Creating new settings');
        result = await supabase
          .from('store_settings')
          .insert({
            ...settingsToSave,
            user_id: targetUserId
          });
      }

      if (result.error) {
        console.error('Error saving store settings:', result.error);
        setError(result.error.message);
        throw new Error('Erro ao salvar configurações: ' + result.error.message);
      }

      console.log('🔍 Debug Context: Settings saved successfully');
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating store settings:', error);
      throw error;
    }
  };

  const refetch = async () => {
    await fetchStoreSettings(false);
  };

  useEffect(() => {
    fetchStoreSettings();
  }, []);

  return (
    <StoreSettingsContext.Provider value={{
      settings,
      loading,
      error,
      updateSettings,
      refetch
    }}>
      {children}
    </StoreSettingsContext.Provider>
  );
};
