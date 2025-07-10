-- Corrigir a função get_current_domain_owner para funcionar corretamente
CREATE OR REPLACE FUNCTION public.get_current_domain_owner()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN get_current_domain() IN ('localhost', '127.0.0.1', '127.0.0.1:5173', 'localhost:5173', 'localhost:5174') THEN 
      auth.uid()
    ELSE (
      SELECT d.user_id FROM public.domain_owners d
      WHERE d.domain = get_current_domain()
      LIMIT 1
    )
  END;
$$;

-- Garantir que profiles são criados automaticamente quando usuários se registram
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Criar profile se não existir
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Criar store_settings se não existir
  INSERT INTO public.store_settings (user_id, store_name, store_description)
  VALUES (
    NEW.id,
    'Minha Loja',
    'Catálogo de produtos'
  ) ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Corrigir políticas de store_settings para usar domínio atual
DROP POLICY IF EXISTS "Domain owner can view store settings" ON public.store_settings;
CREATE POLICY "Domain owner can view store settings"
ON public.store_settings 
FOR SELECT 
USING (user_id = get_current_domain_owner());

DROP POLICY IF EXISTS "Domain owner can manage store settings" ON public.store_settings;
CREATE POLICY "Domain owner can manage store settings"
ON public.store_settings 
FOR ALL
USING (user_id = get_current_domain_owner())
WITH CHECK (user_id = get_current_domain_owner());