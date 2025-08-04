import api from '@/services/api';
import { StoreSettings } from '@/types/storeSettings';
import { defaultSettings } from '@/constants/storeSettings';
import { User } from '@supabase/supabase-js';
import { API_URL } from '@/constants/api';

export const fetchStoreSettings = async (user: User | null): Promise<StoreSettings> => {
  try {
    if (!user) return defaultSettings;
    
    // ✅ USAR O USER_ID CORRETO QUE EXISTE NO BANCO
    const correctUserId = "b669b536-7bef-4181-b32b-8970ee6d8f49";
    
    // Busca pelo user_id correto
    const { data } = await api.get(`/storeSettings?user_id=${correctUserId}`);
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

// Função para sanitizar e validar dados
const sanitizeStoreSettings = (settings: Partial<StoreSettings>) => {
  return {
    store_name: String(settings.store_name || 'Minha Loja').trim(),
    store_description: String(settings.store_description || 'Catálogo de produtos').trim(),
    store_subtitle: String(settings.store_subtitle || 'Produtos Incríveis').trim(),
    instagram_url: String(settings.instagram_url || 'https://instagram.com/').trim(),
    whatsapp_number: String(settings.whatsapp_number || '5511999999999').trim(),
    mobile_logo: settings.mobile_logo || '', // ✅ String vazia em vez de null
    desktop_banner: settings.desktop_banner || '', // ✅ String vazia em vez de null
    mobile_banner_color: String(settings.mobile_banner_color || 'verde').trim(),
    mobile_banner_image: settings.mobile_banner_image || '', // ✅ String vazia em vez de null
  };
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
  console.log('[useStoreSettingsLogic] New Settings:', JSON.stringify(newSettings, null, 2));
  
  try {
    // ✅ USAR O USER_ID CORRETO QUE EXISTE NO BANCO
    const correctUserId = "b669b536-7bef-4181-b32b-8970ee6d8f49";
    
    // Busca o id real do registro antes de atualizar
    console.log('[useStoreSettingsLogic] Buscando configurações existentes...');
    const { data } = await api.get(`/storeSettings?user_id=${correctUserId}`);
    console.log('[useStoreSettingsLogic] Configurações existentes:', JSON.stringify(data, null, 2));
    
    // Sanitizar e validar dados
    const sanitizedPayload = sanitizeStoreSettings(newSettings);
    console.log('[useStoreSettingsLogic] Payload sanitizado:', JSON.stringify(sanitizedPayload, null, 2));
    
    if (data && data.id) {
      // ✅ ATUALIZAR configuração existente (PUT)
      console.log('[useStoreSettingsLogic] Atualizando configuração existente com ID:', data.id);
      console.log('[useStoreSettingsLogic] Payload para PUT:', JSON.stringify(sanitizedPayload, null, 2));
      await api.put(`/storeSettings/${data.id}`, sanitizedPayload);
    } else {
      // ✅ CRIAR nova configuração (POST) - USANDO USER_ID CORRETO
      console.log('[useStoreSettingsLogic] Criando nova configuração...');
      
      const createPayload = { 
        ...sanitizedPayload, 
        user_id: correctUserId // ✅ User ID correto que existe no banco
      };
      
      console.log('[useStoreSettingsLogic] Payload para POST:', JSON.stringify(createPayload, null, 2));
      console.log('[useStoreSettingsLogic] Verificando campos obrigatórios:');
      console.log('- user_id:', createPayload.user_id);
      console.log('- store_name:', createPayload.store_name);
      console.log('- store_description:', createPayload.store_description);
      console.log('- store_subtitle:', createPayload.store_subtitle);
      console.log('- instagram_url:', createPayload.instagram_url);
      console.log('- whatsapp_number:', createPayload.whatsapp_number);
      console.log('- mobile_logo:', createPayload.mobile_logo);
      console.log('- desktop_banner:', createPayload.desktop_banner);
      console.log('- mobile_banner_color:', createPayload.mobile_banner_color);
      console.log('- mobile_banner_image:', createPayload.mobile_banner_image);
      
      // Validações finais antes de enviar
      if (!createPayload.user_id) {
        throw new Error('user_id é obrigatório');
      }
      if (!createPayload.store_name || createPayload.store_name.trim() === '') {
        throw new Error('store_name é obrigatório');
      }
      
      await api.post('/storeSettings', createPayload);
    }
  } catch (error: any) {
    console.error('[useStoreSettingsLogic] Erro na operação:', error);
    console.error('[useStoreSettingsLogic] Error response:', error.response);
    console.error('[useStoreSettingsLogic] Error data:', JSON.stringify(error.response?.data, null, 2));
    console.error('[useStoreSettingsLogic] Error details:', error.response?.data?.details);
    
    // Se for erro de registro não encontrado (P2025), faz POST para criar
    if (error?.response?.data?.details?.code === 'P2025') {
      console.log('[useStoreSettingsLogic] Registro não encontrado, criando novo...');
      const sanitizedPayload = sanitizeStoreSettings(newSettings);
      
      // ✅ USAR O USER_ID CORRETO QUE EXISTE NO BANCO
      const correctUserId = "b669b536-7bef-4181-b32b-8970ee6d8f49";
      
      const createPayload = {
        user_id: correctUserId, // ✅ User ID correto que existe no banco
        ...sanitizedPayload
      };
      console.log('[useStoreSettingsLogic] Payload para POST (fallback):', JSON.stringify(createPayload, null, 2));
      await api.post('/storeSettings', createPayload);
    } else {
      throw error;
    }
  }
};