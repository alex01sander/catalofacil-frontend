
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/constants/api';

interface AuthContextType {
  user: any | null;
  token: string | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Recuperar token do localStorage
    try {
      const storedToken = localStorage.getItem('jwt_token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
        } catch (parseError) {
          console.error('Erro ao fazer parse do usuário armazenado:', parseError);
          // Limpar dados inválidos
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error('Erro ao acessar localStorage:', error);
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      console.log('Tentando fazer registro com:', { email, fullName });
      const response = await axios.post(`${API_URL}/auth/signup`, {
        email,
        password,
        fullName
      });
      
      console.log('Resposta do registro:', response);
      return { error: null };
    } catch (error: any) {
      console.error('Erro no registro:', error);
      
      let errorMessage = 'Erro ao registrar';
      
      if (error.response) {
        console.error('Erro de resposta:', error.response);
        errorMessage = error.response.data?.message || error.response.statusText || 'Erro no servidor';
      } else if (error.request) {
        console.error('Erro de rede:', error.request);
        errorMessage = 'Erro de conexão. Verifique sua internet.';
      } else {
        errorMessage = error.message || 'Erro inesperado';
      }
      
      return { error: errorMessage };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Tentando fazer login com:', { email, password: '***' });
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      console.log('Resposta do login:', response);
      
      if (!response.data) {
        throw new Error('Resposta vazia do servidor');
      }
      
      const { token, user } = response.data;
      
      if (!token || !user) {
        throw new Error('Token ou dados do usuário não encontrados na resposta');
      }
      
      setToken(token);
      setUser(user);
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { error: null };
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      let errorMessage = 'Erro ao fazer login';
      
      if (error.response) {
        // Erro de resposta do servidor
        console.error('Erro de resposta:', error.response);
        errorMessage = error.response.data?.message || error.response.statusText || 'Erro no servidor';
      } else if (error.request) {
        // Erro de rede
        console.error('Erro de rede:', error.request);
        errorMessage = 'Erro de conexão. Verifique sua internet.';
      } else {
        // Erro geral
        errorMessage = error.message || 'Erro inesperado';
      }
      
      return { error: errorMessage };
    }
  };

  const signOut = async () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    loading,
    signUp,
    signIn,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
