
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

  const fetchStoreSettings = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Busca as configurações globalmente (primeira entrada da tabela) sem depender de autenticação
      const { data, error: fetchError } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching store settings:', fetchError);
        setError(fetchError.message);
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
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error fetching store settings:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      // Em caso de erro, usar configurações padrão para não quebrar a visualização
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    if (!user) {
      throw new Error('User must be authenticated to update settings');
    }

    try {
      setError(null);
      
      // Primeiro, tenta atualizar um registro existente
      const { data: existingData } = await supabase
        .from('store_settings')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (existingData) {
        // Atualiza registro existente
        const { error: updateError } = await supabase
          .from('store_settings')
          .update(newSettings)
          .eq('id', existingData.id);

        if (updateError) {
          console.error('Error updating store settings:', updateError);
          setError(updateError.message);
          throw updateError;
        }
      } else {
        // Cria novo registro se não existir
        const { error: insertError } = await supabase
          .from('store_settings')
          .insert([{
            user_id: user.id,
            ...newSettings
          }]);

        if (insertError) {
          console.error('Error creating store settings:', insertError);
          setError(insertError.message);
          throw insertError;
        }
      }

      // Atualiza o estado local
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating store settings:', error);
      throw error;
    }
  };

  const refetch = async () => {
    await fetchStoreSettings();
  };

  useEffect(() => {
    fetchStoreSettings();
  }, []); // Removido a dependência do user para sempre buscar configurações

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
