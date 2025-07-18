export const API_URL = "https://catalofacil-backend.onrender.com";
import axios from "axios";
import { useAuth } from '@/contexts/AuthContext';

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
