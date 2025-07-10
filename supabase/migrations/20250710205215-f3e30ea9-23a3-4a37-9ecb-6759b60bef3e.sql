-- Ajustar a função get_current_domain_owner para funcionar sem autenticação para visualização pública
-- e criar uma nova função para buscar loja por domínio sem depender de auth
CREATE OR REPLACE FUNCTION public.get_store_by_domain()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN get_current_domain() IN ('localhost', '127.0.0.1', '127.0.0.1:5173', 'localhost:5173', 'localhost:5174') THEN 
      -- Para localhost, pegar a primeira loja criada (ou a do admin)
      (SELECT user_id FROM public.store_settings ORDER BY created_at ASC LIMIT 1)
    ELSE 
      -- Para domínios personalizados, usar o proprietário do domínio
      (SELECT d.user_id FROM public.domain_owners d WHERE d.domain = get_current_domain() LIMIT 1)
  END;
$$;

-- Atualizar as policies da tabela store_settings para permitir leitura pública baseada no domínio
DROP POLICY IF EXISTS "Allow public read access to store settings" ON public.store_settings;
DROP POLICY IF EXISTS "Domain owner can view store settings" ON public.store_settings;

-- Nova policy para leitura pública baseada no domínio
CREATE POLICY "Public can view store settings by domain" ON public.store_settings
FOR SELECT USING (
  user_id = get_store_by_domain()
);

-- Manter policy para edição apenas pelo proprietário
-- A policy "Domain owner can manage store settings" já existe e funciona corretamente