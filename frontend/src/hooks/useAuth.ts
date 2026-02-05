import { useState, useCallback } from 'react';
import api from '../services/api';
import type { User, AuthResponse, LoginCredentials } from '../types/api';

const TOKEN_KEY = import.meta.env.VITE_TOKEN_STORAGE_KEY || 'authToken';
const REFRESH_KEY = import.meta.env.VITE_REFRESH_TOKEN_STORAGE_KEY || 'refreshToken';
const USER_KEY = import.meta.env.VITE_USER_STORAGE_KEY || 'user';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  /**
   * Login com credentials
   * @param credentials - { username, password }
   */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<User | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.post<AuthResponse>('/auth/token/', credentials);
        const { access, refresh, user: userData } = response.data;

        // Armazenar tokens
        localStorage.setItem(TOKEN_KEY, access);
        localStorage.setItem(REFRESH_KEY, refresh);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));

        setUser(userData);
        return userData;
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || 'Falha ao fazer login';
        setError(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Logout e limpeza de dados
   */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setError(null);
  }, []);

  /**
   * Verificar se token é válido (simples check de presença)
   */
  const checkAuth = useCallback(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token;
  }, []);

  /**
   * Obter token atual
   */
  const getToken = useCallback(() => {
    return localStorage.getItem(TOKEN_KEY);
  }, []);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
    getToken,
    clearError,
  };
};
