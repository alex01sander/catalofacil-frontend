
-- Inserir o usuário alexsander01@hotmail.com.br como admin controller
-- Primeiro, vamos buscar o user_id dele na tabela profiles
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Buscar o user_id do alexsander01@hotmail.com.br
  SELECT id INTO admin_user_id 
  FROM public.profiles 
  WHERE email = 'alexsander01@hotmail.com.br';
  
  -- Se encontrou o usuário, inserir como admin controller
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.controller_admins (user_id, email)
    VALUES (admin_user_id, 'alexsander01@hotmail.com.br')
    ON CONFLICT (email) DO NOTHING;
    
    RAISE NOTICE 'Admin controller inserido com sucesso para user_id: %', admin_user_id;
  ELSE
    RAISE NOTICE 'Usuário não encontrado na tabela profiles';
  END IF;
END $$;

-- Verificar se o admin foi inserido corretamente
SELECT * FROM public.controller_admins WHERE email = 'alexsander01@hotmail.com.br';
