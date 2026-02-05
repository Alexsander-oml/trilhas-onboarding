import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { type AxiosError } from 'axios';
import type { ApiError } from '../types/api';

interface ErrorContextType {
  errors: ApiError[];
  addError: (error: ApiError) => void;
  removeError: (index: number) => void;
  clearErrors: () => void;
  showError: (message: string, code?: string) => void;
  showSuccess: (message: string) => void;
  showWarning: (message: string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useErrorHandler = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorHandler must be used within an ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<ApiError[]>([]);

  const addError = (error: ApiError) => {
    setErrors(prev => [...prev, error]);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
      setErrors(prev => prev.filter(e => e !== error));
    }, 5000);
  };

  const removeError = (index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index));
  };

  const clearErrors = () => {
    setErrors([]);
  };

  const showError = (message: string, code?: string) => {
    addError({ message, code });
  };

  const showSuccess = (message: string) => {
    addError({ message, code: 'success' });
  };

  const showWarning = (message: string) => {
    addError({ message, code: 'warning' });
  };

  const value: ErrorContextType = {
    errors,
    addError,
    removeError,
    clearErrors,
    showError,
    showSuccess,
    showWarning,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
      <ErrorDisplay />
    </ErrorContext.Provider>
  );
};

// Componente para exibir os erros
const ErrorDisplay: React.FC = () => {
  const { errors, removeError } = useErrorHandler();

  if (errors.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {errors.map((error, index) => (
        <div
          key={index}
          className={`
            max-w-sm p-4 rounded-lg shadow-lg text-white
            ${error.code === 'success' ? 'bg-green-500' : 
              error.code === 'warning' ? 'bg-yellow-500' : 
              'bg-red-500'}
            animate-slideInRight
          `}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-medium">{error.message}</p>
              {error.field && (
                <p className="text-sm opacity-90 mt-1">Campo: {error.field}</p>
              )}
            </div>
            <button
              onClick={() => removeError(index)}
              className="ml-2 text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Hook para tratar erros de API automaticamente
export const useApiErrorHandler = () => {
  const { addError } = useErrorHandler();

  const handleApiError = (error: unknown) => {
    console.error('API Error:', error);

    // Type guard para erro axios
    const isAxiosError = (err: unknown): err is AxiosError => {
      return typeof err === 'object' && err !== null && 'response' in err;
    };

    if (isAxiosError(error) && error?.response?.data) {
      const data = error.response.data as any;
      
      // Erro de validação do Django
      if (typeof data === 'object' && !data.message) {
        Object.entries(data).forEach(([field, messages]) => {
          const message = Array.isArray(messages) ? messages[0] : messages;
          addError({
            message: `${field}: ${message}`,
            field,
            code: 'validation_error'
          });
        });
        return;
      }
      
      // Erro com mensagem específica
      if (data.message || data.detail) {
        addError({
          message: data.message || data.detail,
          code: error.response.status?.toString()
        });
        return;
      }
    }
    
    // Erro de rede
    if (!error.response) {
      addError({
        message: 'Erro de conexão. Verifique sua internet e tente novamente.',
        code: 'network_error'
      });
      return;
    }
    
    // Erro genérico baseado no status
    const status = error.response.status;
    const errorMessages: Record<number, string> = {
      400: 'Dados inválidos enviados',
      401: 'Você precisa fazer login novamente',
      403: 'Você não tem permissão para esta ação',
      404: 'Recurso não encontrado',
      409: 'Conflito: o recurso já existe',
      422: 'Dados enviados contêm erros',
      500: 'Erro interno do servidor. Tente novamente mais tarde.',
      502: 'Servidor temporariamente indisponível',
      503: 'Serviço em manutenção. Tente novamente mais tarde.',
    };
    
    const message = errorMessages[status] || `Erro ${status}: ${error.message || 'Erro desconhecido'}`;
    
    addError({
      message,
      code: status?.toString()
    });
  };

  return { handleApiError };
};

// Animações CSS são tratadas via Tailwind CSS classes