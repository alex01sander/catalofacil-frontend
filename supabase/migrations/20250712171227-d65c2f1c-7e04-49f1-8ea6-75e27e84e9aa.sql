-- Corrigir a função get_current_domain_owner para sempre retornar um user_id válido
CREATE OR REPLACE FUNCTION public.get_current_domain_owner()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT CASE 
    WHEN get_current_domain() IN ('localhost', '127.0.0.1', '127.0.0.1:5173', 'localhost:5173', 'localhost:5174') THEN 
      -- Para localhost, retornar o usuário logado se existir, senão o primeiro usuário com loja
      COALESCE(
        auth.uid(),
        (SELECT user_id FROM public.store_settings ORDER BY created_at ASC LIMIT 1)
      )
    ELSE 
      -- Para domínios customizados, buscar o dono do domínio ou fallback
      COALESCE(
        (SELECT d.user_id FROM public.domain_owners d WHERE d.domain = get_current_domain() LIMIT 1),
        auth.uid(),
        (SELECT user_id FROM public.store_settings ORDER BY created_at ASC LIMIT 1)
      )
  END;
$function$;