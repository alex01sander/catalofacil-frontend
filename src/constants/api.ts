// Usar proxy local para evitar problemas de CORS em produção
export const API_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD ? "/api" : "http://localhost:3000"
);
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
