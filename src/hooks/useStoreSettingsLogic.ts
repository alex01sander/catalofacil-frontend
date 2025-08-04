import api from '@/services/api';
import { StoreSettings } from '@/types/storeSettings';
import { defaultSettings } from '@/constants/storeSettings';
import { User } from '@supabase/supabase-js';
import { API_URL } from '@/constants/api';

export const fetchStoreSettings = async (user: User | null): Promise<StoreSettings> => {
  try {
    if (!user) return defaultSettings;
    // Busca pelo user_id
    const { data } = await api.get(`/storeSettings?user_id=${user.id}`);
    if (data) {
      return {
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
    } else {
      return defaultSettings;
    }
  } catch (error) {
    return defaultSettings;
  }
};

export const updateStoreSettings = async (
  user: User | null, 
  newSettings: Partial<StoreSettings>
): Promise<void> => {
  if (!user) {
    throw new Error('Usuário não autenticado');
  }
  
  console.log('[useStoreSettingsLogic] Iniciando atualização de configurações');
  console.log('[useStoreSettingsLogic] User ID:', user.id);
  console.log('[useStoreSettingsLogic] New Settings:', newSettings);
  
  try {
    // Busca o id real do registro antes de atualizar
    console.log('[useStoreSettingsLogic] Buscando configurações existentes...');
    const { data } = await api.get(`/storeSettings?user_id=${user.id}`);
    console.log('[useStoreSettingsLogic] Configurações existentes:', data);
    
    // Preparar payload com valores padrão para campos obrigatórios
    const payload = {
      user_id: user.id,
      store_name: newSettings.store_name || 'Minha Loja',
      store_description: newSettings.store_description || 'Catálogo de produtos',
      store_subtitle: newSettings.store_subtitle || 'Produtos Incríveis',
      instagram_url: newSettings.instagram_url || 'https://instagram.com/',
      whatsapp_number: newSettings.whatsapp_number || '5511999999999',
      mobile_logo: newSettings.mobile_logo || null,
      desktop_banner: newSettings.desktop_banner || null,
      mobile_banner_color: newSettings.mobile_banner_color || 'verde',
      mobile_banner_image: newSettings.mobile_banner_image || null,
    };
    
    if (data && data.id) {
      console.log('[useStoreSettingsLogic] Atualizando configuração existente com ID:', data.id);
      await api.put(`/storeSettings/${data.id}`, payload);
    } else {
      console.log('[useStoreSettingsLogic] Criando nova configuração...');
      console.log('[useStoreSettingsLogic] Payload para POST:', payload);
      await api.post('/storeSettings', payload);
    }
  } catch (error: any) {
    console.error('[useStoreSettingsLogic] Erro na operação:', error);
    console.error('[useStoreSettingsLogic] Error response:', error.response);
    console.error('[useStoreSettingsLogic] Error data:', error.response?.data);
    
    // Se for erro de registro não encontrado (P2025), faz POST para criar
    if (error?.response?.data?.details?.code === 'P2025') {
      console.log('[useStoreSettingsLogic] Registro não encontrado, criando novo...');
      const payload = {
        user_id: user.id,
        store_name: newSettings.store_name || 'Minha Loja',
        store_description: newSettings.store_description || 'Catálogo de produtos',
        store_subtitle: newSettings.store_subtitle || 'Produtos Incríveis',
        instagram_url: newSettings.instagram_url || 'https://instagram.com/',
        whatsapp_number: newSettings.whatsapp_number || '5511999999999',
        mobile_logo: newSettings.mobile_logo || null,
        desktop_banner: newSettings.desktop_banner || null,
        mobile_banner_color: newSettings.mobile_banner_color || 'verde',
        mobile_banner_image: newSettings.mobile_banner_image || null,
      };
      console.log('[useStoreSettingsLogic] Payload para POST (fallback):', payload);
      await api.post('/storeSettings', payload);
    } else {
      throw error;
    }
  }
};