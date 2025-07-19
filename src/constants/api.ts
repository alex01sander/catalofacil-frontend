export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
import axios from "axios";
import { useAuth } from '@/contexts/AuthContext';

// Configurar interceptors globais do axios
axios.interceptors.request.use(
  (config) => {
    console.log('Requisição sendo feita:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Erro na requisição:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log('Resposta recebida:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Erro na resposta:', error);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
    return Promise.reject(error);
  }
);

// Exemplo de chamada protegida (para uso em componentes ou hooks)
export async function testProtectedProductsApi() {
  const { token } = useAuth();
  if (!token) {
    console.log('Usuário não autenticado');
    return;
  }
  try {
    const res = await axios.get(`${API_URL}/products`, { headers: { Authorization: `Bearer ${token}` } });
    console.log(res.data);
  } catch (err) {
    console.error('Erro ao acessar produtos protegidos:', err);
  }
}
