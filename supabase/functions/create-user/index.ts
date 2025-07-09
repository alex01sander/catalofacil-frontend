
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { email, password, fullName, makeControllerAdmin } = await req.json()

    // Criar o usuário usando service role
    const { data: userData, error: userError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || email
      }
    })

    if (userError) {
      console.error('Erro ao criar usuário:', userError)
      
      // Tratar erro específico de email já existente
      if (userError.message?.includes('already been registered') || userError.message?.includes('email_exists')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Este email já está cadastrado no sistema. Use outro email ou faça login.' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }
      
      // Outros erros
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: userError.message || 'Erro ao criar usuário' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log('Usuário criado:', userData.user?.id)

    // Se foi solicitado para tornar admin controller, adicionar à tabela
    if (makeControllerAdmin && userData.user) {
      const { error: adminError } = await supabaseClient
        .from('controller_admins')
        .insert([
          {
            user_id: userData.user.id,
            email: email
          }
        ])

      if (adminError) {
        console.error('Erro ao criar admin controller:', adminError)
        // Não falhar a criação do usuário por causa disso
      } else {
        console.log('Usuário adicionado como admin controller')
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: userData.user,
        message: 'Usuário criado com sucesso!'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
