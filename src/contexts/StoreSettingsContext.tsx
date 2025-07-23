import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StoreSettings, StoreSettingsContextType } from '@/types/storeSettings';
import { defaultSettings } from '@/constants/storeSettings';
import { fetchStoreSettings, updateStoreSettings } from '@/hooks/useStoreSettingsLogic';
import api from "@/services/api";
import { getStoreSlug } from "@/utils/getStoreSlug";

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

// CONTEXTO DA LOJA PÚBLICA
const StoreContext = createContext(null);

export const useStoreSettings = () => {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider');
  }
  return context;
};

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
  const { user } = useAuth();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const slug = getStoreSlug();

  useEffect(() => {
    setLoading(true);
    
    // Se tiver slug, busca informações públicas da loja
    if (slug) {
      console.log('[StoreProvider] slug detectado:', slug);
      api.get(`/site/public/${slug}`)
        .then(res => {
          console.log('[StoreProvider] Dados públicos da loja recebidos:', res.data);
          setStore(res.data);
        })
        .finally(() => setLoading(false));
    } 
    // Se não tiver slug mas tiver usuário logado, busca a loja do usuário
    else if (user && user.id) {
      console.log('[StoreProvider] Buscando loja do usuário:', user.id);
      api.get(`/storeSettings?user_id=${user.id}`)
        .then(res => {
          console.log('[StoreProvider] Resposta da API para loja do usuário:', res);
          if (res.data) {
            console.log('[StoreProvider] Dados da loja do usuário recebidos:', res.data);
            // Garantir que o objeto store tenha um id
            const storeData = {
              ...res.data,
              id: res.data.id || res.data.store_id
            };
            console.log('[StoreProvider] Dados da loja formatados:', storeData);
            setStore(storeData);
          } else {
            console.log('[StoreProvider] Nenhum dado de loja encontrado para o usuário');
          }
        })
        .catch(err => {
          console.error('[StoreProvider] Erro ao buscar loja do usuário:', err);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [slug, user]);

  return (
    <StoreContext.Provider value={{ store, slug, loading }}>
      {children}
    </StoreContext.Provider>
  );
};

interface StoreSettingsProviderProps {
  children: ReactNode;
}

export const StoreSettingsProvider = ({ children }: StoreSettingsProviderProps) => {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const slug = getStoreSlug();

  const loadSettings = async () => {
    try {
      setError(null);
      setLoading(true);
      const fetchedSettings = await fetchStoreSettings(user);
      setSettings(fetchedSettings);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<StoreSettings>) => {
    try {
      setError(null);
      await updateStoreSettings(user, newSettings);
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
    } catch (error) {
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