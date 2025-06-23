
-- Adicionar campos ausentes na tabela store_settings
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS store_subtitle text DEFAULT 'Produtos Incríveis',
ADD COLUMN IF NOT EXISTS instagram_url text DEFAULT 'https://instagram.com/',
ADD COLUMN IF NOT EXISTS whatsapp_number text DEFAULT '5511999999999';
