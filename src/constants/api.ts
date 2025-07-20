export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
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
    const res = await axios.get(`${API_URL}/products`, { headers: { Authorization: `Bearer ${token}` } });
  } catch (err) {
  }
}
