
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StoreSettings {
  id?: string;
  store_name: string;
  store_description: string;
  mobile_logo: string | null;
  desktop_banner: string | null;
  mobile_banner_color: string;
  mobile_banner_image: string | null;
}

export const useStoreSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: 'LinkStore',
    store_description: 'Catálogo de todos os seus produtos\nque você sempre desejou encontrar',
    mobile_logo: '/lovable-uploads/481d6627-3dbb-4c82-8d6f-53e1613133b2.png',
    desktop_banner: '/lovable-uploads/c43cdca8-1978-4d87-a0d8-4241b90270c6.png',
    mobile_banner_color: 'from-green-400 via-green-500 to-green-600',
    mobile_banner_image: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStoreSettings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchStoreSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching store settings:', error);
        return;
      }

      if (data) {
        setSettings({
          id: data.id,
          store_name: data.store_name,
          store_description: data.store_description,
          mobile_logo: data.mobile_logo,
          desktop_banner: data.desktop_banner,
          mobile_banner_color: data.mobile_banner_color,
          mobile_banner_image: data.mobile_banner_image
        });
      }
    } catch (error) {
      console.error('Error fetching store settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStoreSettings = async (newSettings: Partial<StoreSettings>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('store_settings')
        .update(newSettings)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating store settings:', error);
        throw error;
      }

      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error('Error updating store settings:', error);
      throw error;
    }
  };

  return {
    settings,
    loading,
    updateStoreSettings,
    refetch: fetchStoreSettings
  };
};
