import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useCurrentUser, useLogin, useLogout } from '../hooks/useApi';
import { authService } from '../services/authService';
import type { User, LoginCredentials } from '../types/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // React Query hooks
  const { 
    data: currentUser, 
    isLoading: isLoadingUser, 
    refetch: refetchUser,
    error: userError
  } = useCurrentUser();
  
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  // Inicializar usuário do localStorage
  useEffect(() => {
    const storedUser = authService.getStoredUser();
    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser);
    }
    setIsInitialized(true);
  }, []);

  // Sincronizar com dados do React Query
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
      // Atualizar localStorage
      localStorage.setItem('user', JSON.stringify(currentUser));
    } else if (userError && authService.isAuthenticated()) {
      // Erro ao buscar usuário, mas token ainda válido - tentar novamente
      console.warn('Erro ao buscar usuário atual:', userError);
    }
  }, [currentUser, userError]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      const result = await loginMutation.mutateAsync(credentials);
      setUser(result.user);
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await logoutMutation.mutateAsync();
      setUser(null);
    } catch (error) {
      console.error('Erro no logout:', error);
      // Mesmo com erro, limpar estado local
      setUser(null);
    }
  };

  const refreshUser = () => {
    refetchUser();
  };

  const isAuthenticated = !!user && authService.isAuthenticated();
  const isLoading = !isInitialized || (authService.isAuthenticated() && isLoadingUser);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};