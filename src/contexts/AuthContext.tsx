
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/services/api';

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para verificar se o token está válido
  const verifyToken = async (tokenToVerify: string): Promise<boolean> => {
    try {
      const response = await api.get('/auth/verify', {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`
        }
      });
      return response.status === 200;
    } catch (error) {
      console.error('[Auth] Erro ao verificar token:', error);
      return false;
    }
  };

  // Função para renovar token automaticamente
  const refreshToken = async (): Promise<boolean> => {
    try {
      console.log('[Auth] 🔄 Tentando renovar token...');
      
      // Limpar tokens antigos
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      // Tentar fazer login automático se tivermos credenciais salvas
      const savedEmail = localStorage.getItem('userEmail');
      if (!savedEmail) {
        console.log('[Auth] ❌ Sem email salvo para renovação automática');
        return false;
      }

      // Nota: Em produção, você deve implementar refresh tokens
      // Por ora, direcionamos para nova autenticação
      console.log('[Auth] 🔑 Token expirado - necessário novo login');
      await signOut();
      return false;
      
    } catch (error) {
      console.error('[Auth] ❌ Erro ao renovar token:', error);
      return false;
    }
  };

  // Função para fazer login
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('[Auth] 🔑 Fazendo login...');
      
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;

      // Verificar se o token está válido
      const isValid = await verifyToken(newToken);
      if (!isValid) {
        throw new Error('Token recebido é inválido');
      }

      // Salvar dados
      localStorage.setItem('token', newToken);
      localStorage.setItem('userEmail', email); // Para possível renovação
      setToken(newToken);
      setUser(userData);
      
      console.log('[Auth] ✅ Login realizado com sucesso');
    } catch (error) {
      console.error('[Auth] ❌ Erro no login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função para fazer logout
  const signOut = async () => {
    console.log('[Auth] 🚪 Fazendo logout...');
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Verificar token ao carregar a aplicação
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      console.log('Token carregado no AuthContext:', savedToken);
      
      if (savedToken) {
        console.log('[Auth] 🔍 Verificando token salvo...');
        
        // Verificar se o token está válido
        const isValid = await verifyToken(savedToken);
        
        if (isValid) {
          console.log('[Auth] ✅ Token válido');
          // Usar o token sem buscar /auth/me (que não existe)
          setToken(savedToken);
          // Definir usuário básico baseado no email salvo
          const savedEmail = localStorage.getItem('userEmail');
          if (savedEmail) {
            setUser({
              id: 'user-id', // Será definido pelo backend quando necessário
              email: savedEmail,
              createdAt: new Date().toISOString()
            });
          }
        } else {
          console.log('[Auth] ❌ Token inválido ou expirado');
          const renewed = await refreshToken();
          if (!renewed) {
            await signOut();
          }
        }
      } else {
        console.log('[Auth] ℹ️ Nenhum token encontrado');
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const value = {
    user,
    token,
    signIn,
    signOut,
    loading,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
