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
    // Check cache first
    const now = Date.now();
    const cacheKey = `store_settings_domain`;
    if (useCache && lastFetch && (now - lastFetch) < CACHE_DURATION) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Buscar o proprietário do domínio atual
      const { data: domainOwner, error: domainError } = await supabase
        .rpc('get_current_domain_owner');
      
      if (domainError) {
        console.error('Error getting domain owner:', domainError);
        setSettings(defaultSettings);
        setLoading(false);
        return;
      }
      
      // Se não encontrou proprietário do domínio, usar configurações padrão
      if (!domainOwner) {
        setSettings(defaultSettings);
        setLoading(false);
        return;
      }
      
      // Buscar configurações da loja do proprietário do domínio
      const { data, error: fetchError } = await supabase
        .from('store_settings')
        .select('*')
        .eq('user_id', domainOwner)
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
        setLastFetch(now);
        // Cache por domínio
        localStorage.setItem(cacheKey, JSON.stringify({
          data: newSettings,
          timestamp: now
        }));
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
    if (!user) return;

    try {
      setError(null);
      const { error: updateError } = await supabase
        .from('store_settings')
        .update(newSettings)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating store settings:', updateError);
        setError(updateError.message);
        throw updateError;
      }

      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      setLastFetch(Date.now());
      
      // Update cache with user ID
      const cacheKey = `store_settings_${user.id}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        data: updatedSettings,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error updating store settings:', error);
      throw error;
    }
  };

  const refetch = async () => {
    setLastFetch(0); // Force refresh
    await fetchStoreSettings(false);
  };

  useEffect(() => {
    // Cache por domínio
    const cacheKey = `store_settings_domain`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        if ((now - timestamp) < CACHE_DURATION) {
          setSettings(data);
          setLastFetch(timestamp);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error parsing cached settings:', error);
        localStorage.removeItem(cacheKey);
      }
    }
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
