// 🚀 SOLUÇÃO IMEDIATA - Executar no Console do Browser
// Execute este código no console do navegador (F12 → Console)

console.log('🔧 Iniciando correção automática do token...');

async function corrigirAutenticacao() {
  try {
    // 1. Limpar token antigo
    console.log('🧹 Limpando token antigo...');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('authToken');
    
    // 2. Fazer novo login
    console.log('🔑 Fazendo login para obter novo token...');
    const response = await fetch('https://catalofacil-backend.onrender.com/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'alexsander01@hotmail.com.br',
        password: '123456'
      })
    });

    if (!response.ok) {
      throw new Error(`Erro no login: ${response.status}`);
    }

    const data = await response.json();
    const novoToken = data.token;

    // 3. Salvar novo token
    console.log('💾 Salvando novo token...');
    localStorage.setItem('token', novoToken);
    
    // 4. Verificar se o token está funcionando
    console.log('✅ Testando novo token...');
    const testResponse = await fetch('https://catalofacil-backend.onrender.com/auth/verify', {
      headers: {
        'Authorization': `Bearer ${novoToken}`
      }
    });

    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('🎉 SUCCESS! Token válido:', testData.user);
      console.log('🔄 Recarregando página...');
      
      // 5. Recarregar página
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } else {
      console.error('❌ Token ainda não está funcionando');
    }

  } catch (error) {
    console.error('❌ Erro na correção:', error);
    console.log('📋 Tente fazer login manual na aplicação');
  }
}

// Executar correção
corrigirAutenticacao();

console.log(`
📋 INSTRUÇÕES ALTERNATIVAS:
1. Abra o DevTools (F12)
2. Vá na aba Application/Storage
3. Limpe localStorage e sessionStorage
4. Faça login novamente na aplicação

🔍 PARA DEBUG:
- Token atual: ${localStorage.getItem('token') ? 'Existe' : 'Não existe'}
- Verificar em: Application → Local Storage → Domínio
`); 