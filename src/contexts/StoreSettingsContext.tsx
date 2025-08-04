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
      console.log('[StoreProvider] ID encontrado em data.store.id:', storeId);
    }
    
    // Verificar se há um objeto settings com store_id
    if (!storeId && data.settings && data.settings.store_id) {
      storeId = data.settings.store_id;
      console.log('[StoreProvider] ID encontrado em data.settings.store_id:', storeId);
    }
    
    // Verificar se há um objeto store_settings com store_id
    if (!storeId && data.store_settings && data.store_settings.store_id) {
      storeId = data.store_settings.store_id;
      console.log('[StoreProvider] ID encontrado em data.store_settings.store_id:', storeId);
    }
    
    // Verificar se há um objeto store_settings com id
    if (!storeId && data.store_settings && data.store_settings.id) {
      storeId = data.store_settings.id;
      console.log('[StoreProvider] ID encontrado em data.store_settings.id:', storeId);
    }
    
    // Verificar se há um objeto store_id dentro de um objeto store
    if (!storeId && data.store && data.store.store_id) {
      storeId = data.store.store_id;
      console.log('[StoreProvider] ID encontrado em data.store.store_id:', storeId);
    }
    
    // Verificar se há um objeto store_id dentro de um objeto settings
    if (!storeId && data.settings && data.settings.id) {
      storeId = data.settings.id;
      console.log('[StoreProvider] ID encontrado em data.settings.id:', storeId);
    }
    
    // Verificar se há um objeto id dentro de um objeto store_settings
    if (!storeId && data.store_settings && data.store_settings.id) {
      storeId = data.store_settings.id;
      console.log('[StoreProvider] ID encontrado em data.store_settings.id:', storeId);
    }
    
    // Criar uma cópia com o ID garantido
    const storeData = {
      ...data,
      id: storeId // Agora só define se for válido
    };
    if (!storeId) {
      console.warn('[StoreProvider] ATENÇÃO: ID da loja não encontrado ou inválido! Corrija o backend para sempre enviar o id correto.');
    }
    
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
          console.log('[StoreProvider] Estrutura completa da resposta:', JSON.stringify(res.data, null, 2));
          
          if (res.data) {
            console.log('[StoreProvider] Dados da loja do usuário recebidos:', res.data);
            
            // Verificar se a resposta contém um objeto store diretamente
            if (res.data.store && typeof res.data.store === 'object') {
              console.log('[StoreProvider] Objeto store encontrado na resposta:', res.data.store);
            }
            
            // Verificar a estrutura completa da resposta para encontrar o ID
            console.log('[StoreProvider] Verificando estrutura completa da resposta:');
            if (res.data) {
              Object.keys(res.data).forEach(key => {
                console.log(`- Propriedade ${key}:`, res.data[key]);
                if (typeof res.data[key] === 'object' && res.data[key] !== null) {
                  console.log(`  - Subpropriedades de ${key}:`, Object.keys(res.data[key]));
                }
              });
            }
            
            // Garantir que o objeto store tenha um id
            const storeData = ensureStoreHasId(res.data);
            console.log('[StoreProvider] Dados da loja formatados com ID:', storeData);
            
            if (!storeData.id) {
              console.error('[StoreProvider] ALERTA: Não foi possível determinar o ID da loja!');
              
              // Tentativa adicional de extrair o ID
              if (res.data.store && res.data.store.id) {
                console.log('[StoreProvider] ID encontrado em res.data.store.id:', res.data.store.id);
                storeData.id = res.data.store.id;
              } else if (res.data.store_id) {
                console.log('[StoreProvider] ID encontrado em res.data.store_id:', res.data.store_id);
                storeData.id = res.data.store_id;
              } else if (res.data.id) {
                console.log('[StoreProvider] ID encontrado em res.data.id:', res.data.id);
                storeData.id = res.data.id;
              }
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

  // Helper para validar UUID
  function isValidUUID(uuid) {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid);
  }

  // Extrair o ID da loja para garantir que sempre temos acesso a ele
  // Verificar todas as possíveis localizações do ID
  const extractStoreId = () => {
    if (!store) return undefined;
    // Verificar todas as possíveis localizações do ID
    const possibleLocations = [
      store.id,
      store.store_id,
      store.store?.id,
      store.store?.store_id,
      store.settings?.store_id,
      store.settings?.id,
      store.store_settings?.store_id,
      store.store_settings?.id
    ];
    // Encontrar o primeiro valor válido que seja um UUID
    const foundId = possibleLocations.find(id => id !== undefined && id !== null && isValidUUID(id));
    console.log('[StoreProvider] Possíveis localizações de ID verificadas:', possibleLocations);
    console.log('[StoreProvider] ID válido encontrado:', foundId);
    return foundId;
  };

  const storeId = extractStoreId();
  
  // Log adicional para debug do storeId
  useEffect(() => {
    if (store && !storeId) {
      console.error('[StoreProvider] ALERTA CRÍTICO: Não foi possível extrair o ID da loja!');
      console.error('[StoreProvider] Estrutura do objeto store:', JSON.stringify(store, null, 2));
      console.error('[StoreProvider] Verificando propriedades específicas:');
      console.error('- store.id:', store.id);
      console.error('- store.store_id:', store.store_id);
      console.error('- store.store?.id:', store.store?.id);
      console.error('- store.settings?.store_id:', store.settings?.store_id);
      console.error('- store.store_settings?.id:', store.store_settings?.id);
    } else if (storeId) {
      console.log('[StoreProvider] storeId extraído com sucesso:', storeId);
    }
  }, [store, storeId]);
  
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