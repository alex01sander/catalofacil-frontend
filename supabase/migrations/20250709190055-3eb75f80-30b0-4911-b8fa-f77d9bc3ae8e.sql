-- Adicionar política para permitir inserção pública na tabela orders
-- Isso é necessário para que usuários não autenticados possam criar pedidos via vitrine

DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;

CREATE POLICY "Public can insert orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- Também adicionar política para order_items
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;

CREATE POLICY "Public can insert order items" 
ON public.order_items 
FOR INSERT 
WITH CHECK (true);