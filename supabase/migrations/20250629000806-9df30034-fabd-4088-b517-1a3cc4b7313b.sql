
-- Habilitar RLS nas tabelas categories e products se ainda não estiver habilitado
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA CATEGORIAS
-- Remover políticas públicas existentes se houver e criar nova
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
CREATE POLICY "Public can view categories" 
  ON public.categories 
  FOR SELECT 
  USING (true);

-- Manter políticas administrativas para categorias
DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;
CREATE POLICY "Users can manage own categories" 
  ON public.categories 
  FOR ALL 
  USING (auth.uid() = user_id);

-- POLÍTICAS PARA PRODUTOS
-- Remover políticas públicas existentes se houver e criar nova
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" 
  ON public.products 
  FOR SELECT 
  USING (is_active = true);

-- Manter políticas administrativas para produtos
DROP POLICY IF EXISTS "Users can manage own products" ON public.products;
CREATE POLICY "Users can manage own products" 
  ON public.products 
  FOR ALL 
  USING (auth.uid() = user_id);
