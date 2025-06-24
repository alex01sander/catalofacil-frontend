
-- Primeiro, vamos habilitar RLS nas tabelas se ainda não estiver habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_owners ENABLE ROW LEVEL SECURITY;

-- Criar função para verificar se usuário é admin controller
CREATE OR REPLACE FUNCTION public.is_controller_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.controller_admins 
    WHERE controller_admins.user_id = $1
  );
$$;

-- Política para permitir que admins controller vejam todos os profiles
CREATE POLICY "Controller admins can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (public.is_controller_admin(auth.uid()));

-- Política para permitir que admins controller vejam todos os domain_owners
CREATE POLICY "Controller admins can view all domain_owners" 
  ON public.domain_owners 
  FOR SELECT 
  USING (public.is_controller_admin(auth.uid()));

-- Política para permitir que admins controller insiram domain_owners
CREATE POLICY "Controller admins can insert domain_owners" 
  ON public.domain_owners 
  FOR INSERT 
  WITH CHECK (public.is_controller_admin(auth.uid()));

-- Política para permitir que admins controller deletem domain_owners
CREATE POLICY "Controller admins can delete domain_owners" 
  ON public.domain_owners 
  FOR DELETE 
  USING (public.is_controller_admin(auth.uid()));
