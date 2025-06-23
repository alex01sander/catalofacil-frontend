
-- Remover políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert their own products" ON public.products;
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
DROP POLICY IF EXISTS "Users can manage own products" ON public.products;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;

DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view categories" ON public.categories;

DROP POLICY IF EXISTS "Users can view their own store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Users can update their own store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Users can view own store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Users can update own store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Users can insert own store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;

DROP POLICY IF EXISTS "Users can view their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can insert their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can update their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can delete their own sales" ON public.sales;

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;

DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update own customers" ON public.customers;

-- Habilitar RLS em todas as tabelas principais
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Políticas para produtos (usuário só vê seus próprios produtos)
CREATE POLICY "Users can view their own products" ON public.products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" ON public.products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" ON public.products
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para categorias
CREATE POLICY "Users can view their own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para configurações da loja
CREATE POLICY "Users can view their own store settings" ON public.store_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own store settings" ON public.store_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para vendas
CREATE POLICY "Users can view their own sales" ON public.sales
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales" ON public.sales
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales" ON public.sales
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales" ON public.sales
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para pedidos
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid() = store_owner_id);

CREATE POLICY "Users can insert their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = store_owner_id);

CREATE POLICY "Users can update their own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = store_owner_id);

-- Políticas para clientes
CREATE POLICY "Users can view their own customers" ON public.customers
  FOR SELECT USING (auth.uid() = store_owner_id);

CREATE POLICY "Users can insert their own customers" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = store_owner_id);

CREATE POLICY "Users can update their own customers" ON public.customers
  FOR UPDATE USING (auth.uid() = store_owner_id);

-- Política especial para permitir visualização pública de produtos ativos (para o catálogo)
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING (is_active = true);

-- Política especial para permitir visualização pública de categorias (para o catálogo)
CREATE POLICY "Public can view categories" ON public.categories
  FOR SELECT USING (true);

-- Política especial para permitir visualização pública de configurações da loja (para o catálogo)
CREATE POLICY "Public can view store settings" ON public.store_settings
  FOR SELECT USING (true);
