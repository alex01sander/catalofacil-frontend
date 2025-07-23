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

export interface StoreSettingsContextType {
  settings: StoreSettings;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<void>;
  refetch: () => Promise<void>;
}

export interface StoreContextType {
  store: any; // Tipo do objeto store
  slug: string | null;
  loading: boolean;
  storeId: string | undefined; // ID da loja extraído e garantido
}