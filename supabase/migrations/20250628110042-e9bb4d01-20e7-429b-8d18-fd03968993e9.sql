
-- Habilitar RLS na tabela store_settings se ainda não estiver habilitado
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Remover política existente se houver e criar nova para leitura pública
DROP POLICY IF EXISTS "Allow public read access to store settings" ON public.store_settings;
CREATE POLICY "Allow public read access to store settings" 
  ON public.store_settings 
  FOR SELECT 
  USING (true);

-- Verificar se as outras políticas existem e criar apenas se necessário
DO $$
BEGIN
  -- Política para UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'store_settings' 
    AND policyname = 'Users can update their own store settings'
  ) THEN
    CREATE POLICY "Users can update their own store settings" 
      ON public.store_settings 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;

  -- Política para INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'store_settings' 
    AND policyname = 'Users can insert their own store settings'
  ) THEN
    CREATE POLICY "Users can insert their own store settings" 
      ON public.store_settings 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
