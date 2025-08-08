import axios from "axios";
import { API_URL } from "@/constants/api";

console.log('[DEBUG axios] API_URL:', API_URL);
const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para adicionar token nas requisições
api.interceptors.request.use(config => {
  // Lista de rotas públicas que não precisam de autenticação
  const publicRoutes = [
    '/site/public/', // ✅ Rotas públicas
    '/auth/login',
    '/auth/verify'
  ];
  
  // Verificar se a rota atual é pública
  const isPublicRoute = publicRoutes.some(route => 
    config.url?.includes(route)
  );
  
  if (isPublicRoute) {
    console.log('[API] 🌐 Rota pública detectada, não adicionando token:', config.url);
    return config; // ✅ Não adiciona token em rotas públicas
  }
  
  // Adiciona token apenas em rotas protegidas
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[API] 🔑 Token adicionado à requisição:', config.url);
    console.log('[API] 🔑 Token (primeiros 20 chars):', token.substring(0, 20) + '...');
  } else {
    console.log('[API] ⚠️ Nenhum token encontrado para:', config.url);
  }
  return config;
});

// Interceptor para lidar com respostas e tokens expirados
api.interceptors.response.use(
  (response) => {
    console.log('[API] ✅ Resposta recebida:', response.config.url, response.status);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.log('[API] ❌ Erro na requisição:', {
      url: originalRequest.url,
      method: originalRequest.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });

    // Se for erro 401 (Unauthorized) e não for uma tentativa de renovação
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      console.log('[API] ❌ Token expirado (401), mas não redirecionando automaticamente...');
      
      // Limpar token inválido
      localStorage.removeItem('token');
      
      // Não redirecionar automaticamente - deixar o componente decidir
      console.log('[API] 🔄 Token removido, mas mantendo na página atual');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api; 