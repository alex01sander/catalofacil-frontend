import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StoreSettings, StoreSettingsContextType, StoreContextType } from '@/types/storeSettings';
import { defaultSettings } from '@/constants/storeSettings';
import { fetchStoreSettings, updateStoreSettings } from '@/hooks/useStoreSettingsLogic';
import api from "@/services/api";
import { getStoreSlug } from "@/utils/getStoreSlug";

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

// CONTEXTO DA LOJA PÚBLICA
const StoreContext = createContext<StoreContextType | null>(null);

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

  // Função para garantir que o objeto store tenha um ID válido
  const ensureStoreHasId = (data) => {
    if (!data) return null;
    
    console.log('[StoreProvider] Verificando dados da loja para garantir ID:', data);
    
    // Verificar todas as possíveis localizações do ID
    let storeId = data.id || data.store_id;
    
    // Verificar se há um objeto store aninhado com ID
    if (!storeId && data.store && data.store.id) {
      storeId = data.store.id;
    }
    
    // Verificar se há um objeto settings com store_id
    if (!storeId && data.settings && data.settings.store_id) {
      storeId = data.settings.store_id;
    }
    
    // Criar uma cópia com o ID garantido
    const storeData = {
      ...data,
      id: storeId
    };
    
    console.log('[StoreProvider] ID da loja encontrado:', storeId);
    console.log('[StoreProvider] Dados da loja com ID garantido:', storeData);
    
    return storeData;
  };

  useEffect(() => {
    setLoading(true);
    
    // Se tiver slug, busca informações públicas da loja
    if (slug) {
      console.log('[StoreProvider] slug detectado:', slug);
      api.get(`/site/public/${slug}`)
        .then(res => {
          console.log('[StoreProvider] Dados públicos da loja recebidos:', res.data);
          // Garantir que o objeto store tenha um id mesmo para lojas públicas
          const storeData = ensureStoreHasId(res.data);
          console.log('[StoreProvider] Dados da loja pública formatados:', storeData);
          setStore(storeData);
        })
        .catch(err => {
          console.error('[StoreProvider] Erro ao buscar loja pública:', err);
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
            const storeData = ensureStoreHasId(res.data);
            console.log('[StoreProvider] Dados da loja formatados com ID:', storeData);
            if (!storeData.id) {
              console.error('[StoreProvider] ALERTA: Não foi possível determinar o ID da loja!');
            }
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
  
  // Log adicional para debug quando o store mudar
  useEffect(() => {
    console.log('[StoreProvider] Store atualizado:', store);
    if (store) {
      console.log('[StoreProvider] Store ID:', store.id);
      if (!store.id) {
        console.error('[StoreProvider] ALERTA: Store sem ID definido!');
      }
    }
  }, [store]);

  // Extrair o ID da loja para garantir que sempre temos acesso a ele
  const storeId = store?.id;
  
  return (
    <StoreContext.Provider value={{ store, slug, loading, storeId }}>
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