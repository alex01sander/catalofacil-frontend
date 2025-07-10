-- Verificar e corrigir a função get_current_domain_owner para funcionar corretamente em todos os casos
CREATE OR REPLACE FUNCTION public.get_current_domain_owner()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN get_current_domain() IN ('localhost', '127.0.0.1', '127.0.0.1:5173', 'localhost:5173', 'localhost:5174') THEN 
      auth.uid()
    ELSE 
      COALESCE(
        (SELECT d.user_id FROM public.domain_owners d WHERE d.domain = get_current_domain() LIMIT 1),
        auth.uid()
      )
  END;
$$;

-- Verificar se a função get_current_domain está retornando o valor correto
-- Vamos também criar uma função de debug para ajudar
CREATE OR REPLACE FUNCTION public.debug_domain_info()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'current_domain', get_current_domain(),
    'auth_uid', auth.uid(),
    'domain_owner', get_current_domain_owner(),
    'domain_exists', EXISTS(SELECT 1 FROM public.domain_owners WHERE domain = get_current_domain())
  );
$$;