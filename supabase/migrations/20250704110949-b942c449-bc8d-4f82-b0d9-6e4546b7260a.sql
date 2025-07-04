-- Criar tabela de lojas (stores)
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain TEXT UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  whatsapp_number TEXT,
  instagram_url TEXT,
  theme_color TEXT DEFAULT '#2980B9',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar store_id às tabelas existentes
ALTER TABLE public.products ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.sales ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD COLUMN store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE;

-- Habilitar RLS na tabela stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para stores
CREATE POLICY "Public can view stores" ON public.stores
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own stores" ON public.stores
  FOR ALL USING (auth.uid() = user_id);

-- Atualizar políticas RLS para products (multitenant)
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Domain products visible to public" ON public.products;
DROP POLICY IF EXISTS "Users can manage own products" ON public.products;

CREATE POLICY "Public can view active products by store" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Store owners can manage their products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = products.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Atualizar políticas RLS para categories (multitenant)
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Users can manage own categories" ON public.categories;

CREATE POLICY "Public can view categories by store" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Store owners can manage their categories" ON public.categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = categories.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Atualizar políticas RLS para sales (multitenant)
DROP POLICY IF EXISTS "Users can view their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can insert their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can update their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can delete their own sales" ON public.sales;

CREATE POLICY "Store owners can manage their sales" ON public.sales
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = sales.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Atualizar políticas RLS para customers (multitenant)
DROP POLICY IF EXISTS "Store owners can view own customers" ON public.customers;
DROP POLICY IF EXISTS "Store owners can insert own customers" ON public.customers;
DROP POLICY IF EXISTS "Store owners can update own customers" ON public.customers;
DROP POLICY IF EXISTS "Store owners can delete own customers" ON public.customers;

CREATE POLICY "Store owners can manage their customers" ON public.customers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = customers.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Atualizar políticas RLS para orders (multitenant)
DROP POLICY IF EXISTS "Store owners can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can update own orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can delete own orders" ON public.orders;

CREATE POLICY "Store owners can manage their orders" ON public.orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE stores.id = orders.store_id
      AND stores.user_id = auth.uid()
    )
  );

-- Função para obter a loja atual pelo domínio
CREATE OR REPLACE FUNCTION public.get_current_store()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN get_current_domain() IN ('localhost', '127.0.0.1') THEN (
      SELECT id FROM public.stores WHERE user_id = auth.uid() LIMIT 1
    )
    ELSE (
      SELECT id FROM public.stores 
      WHERE domain = get_current_domain() 
         OR slug = split_part(get_current_domain(), '.', 1)
      LIMIT 1
    )
  END;
$$;

-- Função para migrar dados existentes para uma loja padrão
-- Cada usuário terá sua primeira loja criada automaticamente
INSERT INTO public.stores (name, slug, user_id, description)
SELECT 
  COALESCE(ss.store_name, 'Minha Loja'),
  'loja-' || LOWER(REPLACE(p.email, '@', '-')),
  p.id,
  COALESCE(ss.store_description, 'Catálogo de produtos')
FROM public.profiles p
LEFT JOIN public.store_settings ss ON ss.user_id = p.id
ON CONFLICT (slug) DO NOTHING;

-- Atualizar produtos existentes com store_id
UPDATE public.products 
SET store_id = (
  SELECT s.id FROM public.stores s WHERE s.user_id = products.user_id LIMIT 1
)
WHERE store_id IS NULL;

-- Atualizar categorias existentes com store_id
UPDATE public.categories 
SET store_id = (
  SELECT s.id FROM public.stores s WHERE s.user_id = categories.user_id LIMIT 1
)
WHERE store_id IS NULL;

-- Atualizar vendas existentes com store_id
UPDATE public.sales 
SET store_id = (
  SELECT s.id FROM public.stores s WHERE s.user_id = sales.user_id LIMIT 1
)
WHERE store_id IS NULL;

-- Atualizar clientes existentes com store_id
UPDATE public.customers 
SET store_id = (
  SELECT s.id FROM public.stores s WHERE s.user_id = customers.store_owner_id LIMIT 1
)
WHERE store_id IS NULL;

-- Atualizar pedidos existentes com store_id
UPDATE public.orders 
SET store_id = (
  SELECT s.id FROM public.stores s WHERE s.user_id = orders.store_owner_id LIMIT 1
)
WHERE store_id IS NULL;

-- Criar trigger para atualizar updated_at em stores
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();