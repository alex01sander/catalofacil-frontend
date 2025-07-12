-- Corrigir as funções de domínio para filtrar dados corretamente por domínio específico

-- Função para obter o domínio atual
CREATE OR REPLACE FUNCTION public.get_current_domain()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    current_setting('request.headers', true)::json->>'host',
    'localhost'
  );
$$;

-- Função para obter o proprietário do domínio atual (somente se o domínio existir)
CREATE OR REPLACE FUNCTION public.get_current_domain_owner()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN get_current_domain() IN ('localhost', '127.0.0.1', '127.0.0.1:5173', 'localhost:5173', 'localhost:5174') THEN 
      -- Para localhost, retornar apenas o usuário logado ou nulo
      auth.uid()
    ELSE 
      -- Para domínios customizados, buscar apenas o dono do domínio específico
      (SELECT d.user_id FROM public.domain_owners d WHERE d.domain = get_current_domain() LIMIT 1)
  END;
$$;

-- Função para obter o proprietário da loja do domínio atual
CREATE OR REPLACE FUNCTION public.get_store_by_domain()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT CASE
    WHEN get_current_domain() IN ('localhost', '127.0.0.1', '127.0.0.1:5173', 'localhost:5173', 'localhost:5174') THEN
      -- Para localhost, retornar o usuário logado se existir
      auth.uid()
    ELSE
      -- Para domínios Supabase ou personalizados, usar apenas o proprietário do domínio específico
      (SELECT d.user_id FROM public.domain_owners d WHERE d.domain = get_current_domain() LIMIT 1)
  END;
$$;