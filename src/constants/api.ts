// Usar proxy local para evitar problemas de CORS em produção
console.log('[DEBUG] import.meta.env.PROD:', import.meta.env.PROD);
console.log('[DEBUG] import.meta.env.VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('[DEBUG] window.location.hostname:', window.location.hostname);

// Determinar se estamos em produção baseado no hostname
const isProduction = import.meta.env.PROD || window.location.hostname === 'demo.catalofacil.com.br';

// Forçar uso da URL correta em produção se o proxy não estiver funcionando
export const API_URL = isProduction
  ? "https://catalofacil-backend.onrender.com"  // URL direta em produção
  : (import.meta.env.VITE_API_URL || "http://localhost:3000"); // Em desenvolvimento, usar VITE_API_URL ou localhost

console.log('[DEBUG] API_URL final:', API_URL);
import axios from "axios";
import { useAuth } from '@/contexts/AuthContext';

// Configurar interceptors globais do axios
axios.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
    }
    return Promise.reject(error);
  }
);

// Exemplo de chamada protegida (para uso em componentes ou hooks)
export async function testProtectedProductsApi() {
  const { token } = useAuth();
  if (!token) {
    return;
  }
  try {
    const res = await axios.get('/products', { headers: { Authorization: `Bearer ${token}` } });
  } catch (err) {
  }
}
