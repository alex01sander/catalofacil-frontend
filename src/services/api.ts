import axios from "axios";
import { API_URL } from "@/constants/api";

console.log('[DEBUG axios] API_URL:', API_URL);
const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para adicionar token nas requisições
api.interceptors.request.use(config => {
  // Usar 'token' ao invés de 'jwt_token' (corrigido)
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[API] 🔑 Token adicionado à requisição');
  } else {
    console.log('[API] ⚠️ Nenhum token encontrado');
  }
  return config;
});

// Interceptor para lidar com respostas e tokens expirados
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Se for erro 401 (Unauthorized) e não for uma tentativa de renovação
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      console.log('[API] ❌ Token expirado (401), tentando renovar...');
      
      // Limpar token inválido
      localStorage.removeItem('token');
      
      // Redirecionar para login se estivermos em uma página protegida
      if (window.location.pathname.includes('/admin') || window.location.pathname.includes('/controller')) {
        console.log('[API] 🔄 Redirecionando para login...');
        window.location.href = '/auth';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api; 