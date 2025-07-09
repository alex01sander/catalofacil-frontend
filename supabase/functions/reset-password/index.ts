import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase com service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar se o usuário atual é um controller admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autorização necessário');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: user, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user.user) {
      throw new Error('Token inválido');
    }

    // Verificar se é controller admin
    const { data: isAdmin, error: adminError } = await supabaseAdmin
      .from('controller_admins')
      .select('id')
      .eq('user_id', user.user.id)
      .single();

    if (adminError || !isAdmin) {
      throw new Error('Acesso negado: apenas controller admins podem redefinir senhas');
    }

    const { userEmail, newPassword } = await req.json();

    if (!userEmail || !newPassword) {
      throw new Error('Email e nova senha são obrigatórios');
    }

    if (newPassword.length < 6) {
      throw new Error('A nova senha deve ter pelo menos 6 caracteres');
    }

    console.log('Redefinindo senha para usuário:', userEmail);

    // Buscar o usuário pelo email
    const { data: targetUser, error: findError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (findError) {
      throw new Error('Erro ao buscar usuários');
    }

    const userToUpdate = targetUser.users.find(u => u.email === userEmail);
    
    if (!userToUpdate) {
      throw new Error('Usuário não encontrado');
    }

    // Redefinir a senha
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userToUpdate.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Erro ao redefinir senha:', updateError);
      throw new Error('Erro ao redefinir senha: ' + updateError.message);
    }

    console.log('Senha redefinida com sucesso para:', userEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Senha redefinida com sucesso',
        user: { id: updateData.user.id, email: updateData.user.email }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro na edge function reset-password:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});