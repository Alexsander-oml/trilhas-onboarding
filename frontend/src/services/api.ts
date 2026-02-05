import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

// Configuração base da API
// Use relative URL for client-side requests so it works from localhost and Docker
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Criar instância do axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  // Do not set a default Content-Type here. When sending JSON we rely on
  // axios to set 'application/json'. When sending FormData we must allow
  // the browser/axios to set the multipart boundary automatically.
});

// Storage keys (allow overriding via env)
const TOKEN_STORAGE_KEY = (import.meta.env.VITE_TOKEN_STORAGE_KEY as string) || 'authToken';
const REFRESH_TOKEN_STORAGE_KEY = (import.meta.env.VITE_REFRESH_TOKEN_STORAGE_KEY as string) || 'refreshToken';

// Shared refresh promise to serialize token refreshes and avoid races.
let sharedRefreshPromise: Promise<string> | null = null;

// Interceptor de requisição para adicionar token de autenticação
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta para tratamento de erros e refresh token
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    async function doRefresh(): Promise<string> {
      if (sharedRefreshPromise) return sharedRefreshPromise;
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      if (!refreshToken) throw new Error('No refresh token available');

      // Backend exposes refresh at /api/users/auth/login/refresh/
      sharedRefreshPromise = axios
        .post(`${API_BASE_URL}/users/auth/login/refresh/`, { refresh: refreshToken })
        .then((res) => {
          const newAccess = res.data?.access;
          if (newAccess) {
            localStorage.setItem(TOKEN_STORAGE_KEY, newAccess);
          }
          // If backend rotated refresh token and returns new one, persist it
          if (res.data?.refresh) {
            localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, res.data.refresh);
          }
          return newAccess;
        })
        .catch((e) => {
          // on failure, ensure tokens/user are cleared
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          throw e;
        })
        .finally(() => {
          sharedRefreshPromise = null;
        });

      return sharedRefreshPromise;
    }

    // Se token expirou (401) e não é uma tentativa de retry
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;

      try {
        const access = await doRefresh();
        if (access) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (e) {
        // Refresh falhou — redirecionar para login (poderíamos mostrar modal antes)
        window.location.href = '/login';
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Tipos para respostas da API Django
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Utilitários para requisições
export const apiUtils = {
  // GET request com tipagem
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.get(url, config).then((response) => response.data),

  // POST request com tipagem
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    api.post(url, data, config).then((response) => response.data),

  // PUT request com tipagem
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    api.put(url, data, config).then((response) => response.data),

  // PATCH request com tipagem
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
    api.patch(url, data, config).then((response) => response.data),

  // DELETE request com tipagem
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    api.delete(url, config).then((response) => response.data),

  // Upload de arquivo
  upload: <T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post(url, formData, {
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(Math.round(progress));
        }
      },
    }).then((response) => response.data);
  },
};