-- Corrigir políticas RLS para funcionar com domínios

-- Remover políticas conflitantes de products
DROP POLICY IF EXISTS "Domain owner can view products" ON public.products;
DROP POLICY IF EXISTS "Domain owner can manage products" ON public.products;
DROP POLICY IF EXISTS "Store owners can manage their products" ON public.products;
DROP POLICY IF EXISTS "Public can view active products by store" ON public.products;
DROP POLICY IF EXISTS "Domain owners can manage their products" ON public.products;

-- Criar política simples para visualização pública de produtos (por domínio)
CREATE POLICY "Public can view products by domain"
ON public.products 
FOR SELECT 
USING (is_active = true AND user_id = get_current_domain_owner());

-- Política para proprietários do domínio gerenciarem produtos
CREATE POLICY "Domain owners can manage products"
ON public.products 
FOR ALL
USING (user_id = get_current_domain_owner())
WITH CHECK (user_id = get_current_domain_owner());

-- Remover políticas conflitantes de categories
DROP POLICY IF EXISTS "Domain owner can view categories" ON public.categories;
DROP POLICY IF EXISTS "Domain owner can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Store owners can manage their categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view categories by store" ON public.categories;
DROP POLICY IF EXISTS "Domain owners can manage their categories" ON public.categories;

-- Criar política simples para visualização pública de categorias (por domínio)
CREATE POLICY "Public can view categories by domain"
ON public.categories 
FOR SELECT 
USING (user_id = get_current_domain_owner());

-- Política para proprietários do domínio gerenciarem categorias
CREATE POLICY "Domain owners can manage categories"
ON public.categories 
FOR ALL
USING (user_id = get_current_domain_owner())
WITH CHECK (user_id = get_current_domain_owner());