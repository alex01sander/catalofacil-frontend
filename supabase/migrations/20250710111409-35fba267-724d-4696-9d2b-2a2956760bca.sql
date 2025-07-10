-- Corrigir a função get_current_store para retornar a store correta baseada no domínio
CREATE OR REPLACE FUNCTION public.get_current_store()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN get_current_domain() IN ('localhost', '127.0.0.1') THEN (
      -- Para localhost, retornar a loja do usuário logado
      SELECT s.id FROM public.stores s WHERE s.user_id = auth.uid() LIMIT 1
    )
    ELSE (
      -- Para domínios personalizados, buscar pela relação domain_owners -> stores
      SELECT s.id FROM public.stores s
      INNER JOIN public.domain_owners d ON d.user_id = s.user_id
      WHERE d.domain = get_current_domain()
      LIMIT 1
    )
  END;
$$;

-- Criar função para obter o user_id da loja atual (usado para filtrar dados)
CREATE OR REPLACE FUNCTION public.get_current_store_owner()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN get_current_domain() IN ('localhost', '127.0.0.1') THEN 
      auth.uid()
    ELSE (
      SELECT d.user_id FROM public.domain_owners d
      WHERE d.domain = get_current_domain()
      LIMIT 1
    )
  END;
$$;

-- Atualizar políticas RLS para products para usar domain-based filtering
DROP POLICY IF EXISTS "Domain owner can view products" ON public.products;
CREATE POLICY "Domain owner can view products"
ON public.products 
FOR SELECT 
USING (user_id = get_current_store_owner());

-- Atualizar políticas RLS para categories para usar domain-based filtering
DROP POLICY IF EXISTS "Domain owner can view categories" ON public.categories;
CREATE POLICY "Domain owner can view categories"
ON public.categories 
FOR SELECT 
USING (user_id = get_current_store_owner());