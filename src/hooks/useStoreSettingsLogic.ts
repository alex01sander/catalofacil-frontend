import { supabase } from '@/integrations/supabase/client';
import { StoreSettings } from '@/types/storeSettings';
import { defaultSettings } from '@/constants/storeSettings';
import { User } from '@supabase/supabase-js';

export const fetchStoreSettings = async (user: User | null): Promise<StoreSettings> => {
  try {
    console.log('🔍 Debug Context: Fetching store settings');
    console.log('🔍 Debug Context: Current user:', user?.id);
    
    // Debug das informações do domínio
    const { data: debugInfo, error: debugError } = await supabase
      .rpc('debug_domain_info');
    
    console.log('🔍 Debug Context: Domain debug info:', { debugInfo, debugError });
    
    // Buscar o usuário da loja baseado no domínio (funciona sem autenticação)
    const { data: storeUserId, error: storeError } = await supabase
      .rpc('get_store_by_domain');
    
    console.log('🔍 Debug Context: Store user fetch result:', { storeUserId, storeError });
    
    if (storeError) {
      console.error('Error getting store by domain:', storeError);
      return defaultSettings;
    }
    
    // Se não temos um usuário da loja, usar configurações padrão
    if (!storeUserId) {
      console.log('🔍 Debug Context: No store user found, using default settings');
      return defaultSettings;
    }
    
    console.log('🔍 Debug Context: Target user for fetch:', storeUserId);
    
    // Buscar configurações da loja do usuário (sem filtro adicional, a RLS cuida disso)
    const { data, error: fetchError } = await supabase
      .from('store_settings')
      .select('*')
      .maybeSingle();
    
    console.log('🔍 Debug Context: Store settings query result:', { data, fetchError });

    if (fetchError) {
      console.error('Error fetching store settings:', fetchError);
      throw new Error(fetchError.message);
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
      return newSettings;
    } else {
      // Se não há dados, retornar configurações padrão para o proprietário configurar
      return defaultSettings;
    }
  } catch (error) {
    console.error('Error fetching store settings:', error);
    throw error;
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
    console.log('🔍 Debug Context: Iniciando salvamento das configurações');
    console.log('🔍 Debug Context: User ID:', user.id);
    console.log('🔍 Debug Context: Settings to save:', newSettings);
    
    // SOLUÇÃO: Buscar o user_id do domínio atual - igual ao que é usado na busca pública
    const { data: storeUserId, error: storeError } = await supabase
      .rpc('get_store_by_domain');
    
    console.log('🔍 Debug Context: Store user ID result:', { storeUserId, storeError });
    
    if (storeError) {
      console.error('Error getting store user by domain:', storeError);
      throw new Error('Erro ao identificar proprietário do domínio');
    }

    if (!storeUserId) {
      throw new Error('Nenhuma loja encontrada para este domínio');
    }
    
    // Usar sempre o storeUserId (mesmo que é usado na busca)
    const targetUserId = storeUserId;
    console.log('🔍 Debug Context: Target user ID:', targetUserId);
    
    // Verificar se o usuário logado tem permissão (é o proprietário do domínio)
    if (user.id !== targetUserId) {
      throw new Error('Você não tem permissão para editar as configurações desta loja');
    }

    // Filtrar apenas os campos válidos para salvar
    const { id, ...settingsToSave } = newSettings;
    console.log('🔍 Debug Context: Settings after cleanup:', settingsToSave);

    // Primeiro tentar atualizar, se não existir, criar
    const { data: existingSettings } = await supabase
      .from('store_settings')
      .select('id')
      .eq('user_id', targetUserId)
      .maybeSingle();

    let result;
    if (existingSettings) {
      // Atualizar existente
      console.log('🔍 Debug Context: Updating existing settings');
      result = await supabase
        .from('store_settings')
        .update(settingsToSave)
        .eq('user_id', targetUserId);
    } else {
      // Criar novo
      console.log('🔍 Debug Context: Creating new settings');
      result = await supabase
        .from('store_settings')
        .insert({
          ...settingsToSave,
          user_id: targetUserId
        });
    }

    if (result.error) {
      console.error('Error saving store settings:', result.error);
      throw new Error('Erro ao salvar configurações: ' + result.error.message);
    }

    console.log('🔍 Debug Context: Settings saved successfully');
  } catch (error) {
    console.error('Error updating store settings:', error);
    throw error;
  }
};