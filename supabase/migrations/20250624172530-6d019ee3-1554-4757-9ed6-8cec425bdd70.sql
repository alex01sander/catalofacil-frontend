
-- Criar tabela para mapear domínios aos usuários
CREATE TABLE public.domain_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela de domínios
ALTER TABLE public.domain_owners ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios domínios
CREATE POLICY "Users can view their own domains" ON public.domain_owners
  FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir que usuários insiram apenas seus próprios domínios
CREATE POLICY "Users can insert their own domains" ON public.domain_owners
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem apenas seus próprios domínios
CREATE POLICY "Users can update their own domains" ON public.domain_owners
  FOR UPDATE USING (auth.uid() = user_id);

-- Política especial para visualização pública (necessária para verificar propriedade do domínio)
CREATE POLICY "Public can view domain ownership" ON public.domain_owners
  FOR SELECT USING (true);

-- Inserir alguns domínios de exemplo (substitua pelos seus domínios reais)
-- INSERT INTO public.domain_owners (domain, user_id) VALUES 
-- ('lojaonline.com', 'SEU_USER_ID_AQUI'),
-- ('gpt.com.br', 'OUTRO_USER_ID_AQUI');
