-- Corrigir a função get_current_domain para funcionar corretamente com domínios personalizados

CREATE OR REPLACE FUNCTION public.get_current_domain()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.headers', true)::json->>'host', ''),
    NULLIF(current_setting('request.jwt.claims', true)::json->>'iss', ''),
    'localhost'
  );
$$;

-- Função melhorada para debug
CREATE OR REPLACE FUNCTION public.debug_domain_info()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'current_domain', get_current_domain(),
    'request_headers_host', current_setting('request.headers', true)::json->>'host',
    'request_jwt_claims_iss', current_setting('request.jwt.claims', true)::json->>'iss',
    'auth_uid', auth.uid(),
    'domain_owner', get_current_domain_owner(),
    'domain_exists', EXISTS(SELECT 1 FROM public.domain_owners WHERE domain = get_current_domain()),
    'all_domains', (SELECT json_agg(domain) FROM public.domain_owners)
  );
$$;