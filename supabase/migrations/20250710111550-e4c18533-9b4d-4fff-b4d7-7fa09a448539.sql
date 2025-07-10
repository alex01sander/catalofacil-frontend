-- Criar políticas RLS mais específicas para garantir a separação por domínio

-- Políticas para products - garantir separação por domínio
DROP POLICY IF EXISTS "Users can view their own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert their own products" ON public.products;  
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;

-- Nova política que combina user_id e domain ownership
CREATE POLICY "Domain owners can manage their products"
ON public.products 
FOR ALL
USING (user_id = get_current_store_owner())
WITH CHECK (user_id = get_current_store_owner());

-- Políticas para categories - garantir separação por domínio
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;

-- Nova política que combina user_id e domain ownership
CREATE POLICY "Domain owners can manage their categories"
ON public.categories 
FOR ALL
USING (user_id = get_current_store_owner())
WITH CHECK (user_id = get_current_store_owner());

-- Atualizar a função get_current_store_owner para ser mais robusta
CREATE OR REPLACE FUNCTION public.get_current_store_owner()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN get_current_domain() IN ('localhost', '127.0.0.1', '127.0.0.1:5173', 'localhost:5173') THEN 
      auth.uid()
    ELSE (
      SELECT d.user_id FROM public.domain_owners d
      WHERE d.domain = get_current_domain()
      LIMIT 1
    )
  END;
$$;