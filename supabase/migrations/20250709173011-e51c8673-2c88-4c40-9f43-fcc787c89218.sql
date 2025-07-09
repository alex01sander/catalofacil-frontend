-- Verificar e criar apenas o que não existe
DO $$ 
BEGIN
  -- Verificar se a tabela orders existe, se não, criar
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
    CREATE TABLE public.orders (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      customer_phone TEXT,
      total_amount NUMERIC NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      store_id UUID REFERENCES public.stores(id),
      store_owner_id UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
    
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Verificar se a tabela order_items existe, se não, criar
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items' AND table_schema = 'public') THEN
    CREATE TABLE public.order_items (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES public.products(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price NUMERIC NOT NULL,
      total_price NUMERIC NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Criar políticas apenas se não existirem
DO $$
BEGIN
  -- Políticas para orders
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can view their own orders') THEN
    CREATE POLICY "Users can view their own orders" 
    ON public.orders 
    FOR SELECT 
    USING (auth.uid() = store_owner_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can insert their own orders') THEN
    CREATE POLICY "Users can insert their own orders" 
    ON public.orders 
    FOR INSERT 
    WITH CHECK (auth.uid() = store_owner_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can update their own orders') THEN
    CREATE POLICY "Users can update their own orders" 
    ON public.orders 
    FOR UPDATE 
    USING (auth.uid() = store_owner_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can delete their own orders') THEN
    CREATE POLICY "Users can delete their own orders" 
    ON public.orders 
    FOR DELETE 
    USING (auth.uid() = store_owner_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Store owners can manage their orders') THEN
    CREATE POLICY "Store owners can manage their orders" 
    ON public.orders 
    FOR ALL 
    USING (EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = orders.store_id 
      AND stores.user_id = auth.uid()
    ));
  END IF;

  -- Políticas para order_items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Users can manage order items for own orders') THEN
    CREATE POLICY "Users can manage order items for own orders" 
    ON public.order_items 
    FOR ALL 
    USING (EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.store_owner_id = auth.uid()
    ));
  END IF;
END $$;

-- Criar trigger se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
    CREATE TRIGGER update_orders_updated_at
      BEFORE UPDATE ON public.orders
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_orders_store_owner_id ON public.orders(store_owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);