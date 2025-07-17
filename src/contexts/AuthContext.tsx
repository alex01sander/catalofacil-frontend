
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
    const storedToken = localStorage.getItem('jwt_token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/signup`, {
        email,
        password,
        fullName
      });
      return { error: null };
    } catch (error: any) {
      return { error: error.response?.data?.message || 'Erro ao registrar' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data } = await axios.post(`${API_URL}/auth/login`, {
        email,
        password // Corrigido: deve ser 'password' e não 'senha'
      });
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('jwt_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { error: null };
    } catch (error: any) {
      return { error: error.response?.data?.message || 'Erro ao fazer login' };
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
