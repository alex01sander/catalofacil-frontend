
-- Criar tabela para administradores do sistema
CREATE TABLE public.controller_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Habilitar RLS
ALTER TABLE public.controller_admins ENABLE ROW LEVEL SECURITY;

-- Política para permitir que apenas admins vejam outros admins
CREATE POLICY "Controller admins can view admins" 
  ON public.controller_admins 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.controller_admins ca 
      WHERE ca.user_id = auth.uid()
    )
  );

-- Inserir o usuário alexsander01@hotmail.com.br como admin inicial
-- Primeiro, vamos buscar se ele já existe na tabela profiles
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Buscar o user_id do alexsander01@hotmail.com.br
  SELECT id INTO admin_user_id 
  FROM public.profiles 
  WHERE email = 'alexsander01@hotmail.com.br';
  
  -- Se encontrou o usuário, inserir como admin
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.controller_admins (user_id, email)
    VALUES (admin_user_id, 'alexsander01@hotmail.com.br')
    ON CONFLICT (email) DO NOTHING;
  END IF;
END $$;
