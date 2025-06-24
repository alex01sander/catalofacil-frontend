
-- Remove políticas existentes específicas
DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;

DROP POLICY IF EXISTS "Users can view own store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Users can manage own store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;

DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Users can manage own products" ON public.products;

-- CATEGORIES: Permitir visualização pública para o catálogo
CREATE POLICY "Public can view categories" ON public.categories
  FOR SELECT USING (true);

-- Manter controle administrativo para categorias
CREATE POLICY "Users can manage own categories" ON public.categories
  FOR ALL USING (auth.uid() = user_id);

-- STORE_SETTINGS: Permitir visualização pública das configurações da loja
CREATE POLICY "Public can view store settings" ON public.store_settings
  FOR SELECT USING (true);

-- Manter controle administrativo para configurações
CREATE POLICY "Users can manage own store settings" ON public.store_settings
  FOR ALL USING (auth.uid() = user_id);

-- PRODUCTS: Garantir que produtos ativos sejam visíveis publicamente
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING (is_active = true);

-- Manter controle administrativo para produtos
CREATE POLICY "Users can manage own products" ON public.products
  FOR ALL USING (auth.uid() = user_id);
