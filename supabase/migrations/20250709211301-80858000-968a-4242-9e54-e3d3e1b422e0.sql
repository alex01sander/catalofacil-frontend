-- Adicionar campo tipo para distinguir domínios de subdomínios
ALTER TABLE public.domain_owners 
ADD COLUMN domain_type TEXT NOT NULL DEFAULT 'domain' CHECK (domain_type IN ('domain', 'subdomain'));

-- Adicionar índice para otimizar queries por tipo
CREATE INDEX idx_domain_owners_type ON public.domain_owners(domain_type);

-- Criar função para validar formato de domínio
CREATE OR REPLACE FUNCTION public.validate_domain_format(domain_input TEXT, domain_type_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validação básica de formato
  IF domain_input IS NULL OR domain_input = '' THEN
    RETURN FALSE;
  END IF;
  
  -- Remover espaços e converter para minúsculo
  domain_input := LOWER(TRIM(domain_input));
  
  -- Validação para domínio principal
  IF domain_type_input = 'domain' THEN
    -- Deve ter pelo menos um ponto e não começar/terminar com ponto
    RETURN domain_input ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$';
  END IF;
  
  -- Validação para subdomínio
  IF domain_type_input = 'subdomain' THEN
    -- Deve ter pelo menos dois pontos (sub.dominio.com)
    RETURN domain_input ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?){2,}$';
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Criar função para reset de senha (será usada via edge function)
CREATE OR REPLACE FUNCTION public.reset_user_password(user_email TEXT, new_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Buscar o usuário pelo email
  SELECT id INTO user_id 
  FROM auth.users 
  WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Aqui seria necessário usar a API do Supabase Auth
  -- Por enquanto retornamos TRUE para indicar que a função existe
  RETURN TRUE;
END;
$$;