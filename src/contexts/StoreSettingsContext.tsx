import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StoreSettings, StoreSettingsContextType } from '@/types/storeSettings';
import { defaultSettings } from '@/constants/storeSettings';
import { fetchStoreSettings, updateStoreSettings } from '@/hooks/useStoreSettingsLogic';
import { supabase } from '@/lib/supabaseClient';

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
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const loadSettings = async () => {
    try {
      setError(null);
      setLoading(true);
      const fetchedSettings = await fetchStoreSettings(user);
      setSettings(fetchedSettings);
    } catch (error) {
      console.error('Error loading store settings:', error);
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
      // Buscar o domínio atual
      const domain = window.location.hostname;
      // Buscar o proprietário do domínio
      const { data: owner, error: ownerError } = await supabase
        .from('domain_owners')
        .select('user_id')
        .eq('domain', domain)
        .maybeSingle();
      if (ownerError) {
        console.error('Erro ao buscar proprietário do domínio:', ownerError);
        throw new Error('Erro ao identificar proprietário do domínio');
      }
      const targetUserId = owner?.user_id || user.id;
      // Verificar se o usuário logado é o proprietário do domínio
      if (user.id !== targetUserId) {
        throw new Error('Você não tem permissão para editar as configurações desta loja');
      }
      // Filtrar apenas os campos válidos para salvar
      const settingsToSave = {
        store_name: newSettings.store_name,
        store_description: newSettings.store_description,
        store_subtitle: newSettings.store_subtitle,
        instagram_url: newSettings.instagram_url,
        whatsapp_number: newSettings.whatsapp_number,
        mobile_logo: newSettings.mobile_logo,
        desktop_banner: newSettings.desktop_banner,
        mobile_banner_color: newSettings.mobile_banner_color,
        mobile_banner_image: newSettings.mobile_banner_image
      };
      // Remover campos de data/hora se forem string vazia
      if ((newSettings as any)["created_at"] && (newSettings as any)["created_at"] !== "") {
        (settingsToSave as any)["created_at"] = (newSettings as any)["created_at"];
      }
      if ((newSettings as any)["updated_at"] && (newSettings as any)["updated_at"] !== "") {
        (settingsToSave as any)["updated_at"] = (newSettings as any)["updated_at"];
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
          .update(settingsToSave)
          .eq('user_id', targetUserId);
      } else {
        // Criar novo
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
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      setLastFetch(Date.now());
      // Update cache por domínio
      const cacheKey = `store_settings_domain`;
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
    await loadSettings();
  };

  useEffect(() => {
    // Only load settings after auth is loaded
    if (!authLoading) {
      loadSettings();
    }
  }, [authLoading, user]);

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