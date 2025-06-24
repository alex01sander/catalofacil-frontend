
-- Remover a política atual que está causando recursão
DROP POLICY IF EXISTS "Controller admins can view admins" ON public.controller_admins;

-- Criar uma política mais simples que permite ao usuário ver apenas seu próprio registro
CREATE POLICY "Users can view their own admin status" 
  ON public.controller_admins 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Política para permitir inserção (caso precise adicionar mais admins futuramente)
CREATE POLICY "Service role can manage admins" 
  ON public.controller_admins 
  FOR ALL 
  USING (auth.role() = 'service_role');
