-- Atualizar as políticas RLS para filtrar corretamente por domínio

-- Política para categorias - mostrar apenas se houver um domínio configurado
DROP POLICY IF EXISTS "Public can view categories by domain" ON public.categories;
CREATE POLICY "Public can view categories by domain" ON public.categories
FOR SELECT USING (
  user_id = get_current_domain_owner() AND get_current_domain_owner() IS NOT NULL
);

-- Política para produtos - mostrar apenas se houver um domínio configurado  
DROP POLICY IF EXISTS "Public can view products by domain" ON public.products;
CREATE POLICY "Public can view products by domain" ON public.products
FOR SELECT USING (
  is_active = true AND 
  user_id = get_current_domain_owner() AND 
  get_current_domain_owner() IS NOT NULL
);

-- Política para store_settings - mostrar apenas se houver um domínio configurado
DROP POLICY IF EXISTS "Public can view store settings by domain" ON public.store_settings;
CREATE POLICY "Public can view store settings by domain" ON public.store_settings
FOR SELECT USING (
  user_id = get_store_by_domain() AND get_store_by_domain() IS NOT NULL
);