import axios from "axios";
import { StoreSettings } from '@/types/storeSettings';
import { defaultSettings } from '@/constants/storeSettings';
import { User } from '@supabase/supabase-js';
import { API_URL } from '@/constants/api';

export const fetchStoreSettings = async (user: User | null): Promise<StoreSettings> => {
  try {
    if (!user) return defaultSettings;
    // Busca pelo user_id
    const { data } = await axios.get(`${API_URL}/storeSettings?user_id=${user.id}`);
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
    console.error('Error fetching store settings:', error);
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
  try {
    // Busca o id real do registro antes de atualizar
    const { data } = await axios.get(`${API_URL}/storeSettings?user_id=${user.id}`);
    if (data && data.id) {
      await axios.put(`${API_URL}/storeSettings/${data.id}`, newSettings);
    } else {
      await axios.post(`${API_URL}/storeSettings`, { ...newSettings, user_id: user.id });
    }
  } catch (error: any) {
    // Se for erro de registro não encontrado (P2025), faz POST para criar
    if (error?.response?.data?.details?.code === 'P2025') {
      await axios.post(`${API_URL}/storeSettings`, { ...newSettings, user_id: user.id });
    } else {
      console.error('Error updating store settings:', error);
      throw error;
    }
  }
};