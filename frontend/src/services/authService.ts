import { apiUtils } from './api';
import api from './api';
import type {
  LoginCredentials,
  AuthResponse,
  RegisterData,
  User,
  UserProfile,
} from '../types/api';

export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Backend espera `email` e `password`
    const payload = {
      email: credentials.email.trim(),
      password: credentials.password,
    };

    // The TokenObtainPairView typically returns only { access, refresh }.
    // If the backend also returns `user` that's fine; otherwise fetch current user.
    const tokenResponse = await apiUtils.post<{ access: string; refresh: string; user?: unknown }>('/users/auth/login/', payload);

    // Store tokens
    localStorage.setItem('authToken', tokenResponse.access);
    localStorage.setItem('refreshToken', tokenResponse.refresh);

    // Determine user object: prefer response.user, otherwise call /auth/user/
    let userObj: unknown | null = null;
    if (tokenResponse.user) {
      userObj = tokenResponse.user;
    } else {
      // Try to fetch the full profile from backend endpoint /auth/user/
      try {
        userObj = await apiUtils.get('/users/auth/user/');
      } catch {
        // If endpoint absent or fails, fallback to decode JWT claims
        const access = tokenResponse.access;
        try {
          const parts = access.split('.');
          if (parts.length >= 2) {
            // base64url -> base64
            const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, '=');
            const decoded = JSON.parse(atob(padded));
            // Build a lightweight user object from JWT claims if present
            userObj = {
              id: decoded.user_id ?? decoded.user?.id ?? null,
              username: decoded.username ?? decoded.user?.username ?? decoded.email ?? null,
              email: decoded.email ?? null,
              role: decoded.role ?? null,
            };
          } else {
            userObj = null;
          }
        } catch {
          userObj = null;
        }
      }
    }

    if (userObj) {
      try {
        localStorage.setItem('user', JSON.stringify(userObj));
      } catch {
        // fallback: do not store invalid user
        localStorage.removeItem('user');
      }
    } else {
      localStorage.removeItem('user');
    }

    // Schedule proactive token refresh based on JWT exp claim
    try {
      scheduleTokenRefresh(tokenResponse.access);
    } catch {
      // ignore scheduling errors
    }

    return {
      access: tokenResponse.access,
      refresh: tokenResponse.refresh,
  user: (userObj as unknown as User) ?? null,
    } as AuthResponse;
  },

  // Register
  register: async (data: RegisterData): Promise<AuthResponse> => {
    return apiUtils.post<AuthResponse>('/users/auth/register/', data);
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<{ access: string }> => {
    return apiUtils.post<{ access: string }>('/users/auth/login/refresh/', {
      refresh: refreshToken,
    });
  },

  // Logout
  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await apiUtils.post('/users/auth/logout/', { refresh: refreshToken });
      } catch (error) {
        // If backend doesn't expose a logout endpoint, ignore 404 errors silently.
        // Log only unexpected errors to aid debugging.
        try {
          // axios error shape
          const axiosErr = error as { response?: { status?: number } };
          const status = axiosErr?.response?.status;
          if (!(status && status === 404)) {
            console.error('Erro ao fazer logout:', error);
          }
        } catch {
          console.error('Erro ao fazer logout:', error);
        }
      }
    }
    
    // Limpar localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // cancel any scheduled proactive refresh
    cancelScheduledRefresh();
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    return apiUtils.get<User>('/users/auth/user/');
  },

  // Update user profile
  updateProfile: async (userId: number, data: Partial<UserProfile>): Promise<UserProfile> => {
    return apiUtils.patch<UserProfile>(`/users/${userId}/profile/`, data);
  },

  // Upload avatar file. Tries a few common endpoints; falls back to base64 PATCH if none accept multipart.
  uploadAvatar: async (userId: number, file: File): Promise<any> => {
    // Try only the canonical profile endpoint for multipart upload.
    // This backend exposes `/users/<id>/profile/` which accepts multipart.
    try {
      const form = new FormData();
      form.append('avatar', file);
      try {
        // Let axios set the Content-Type (including boundary) when sending FormData.
        const res = await api.patch(`/users/${userId}/profile/`, form);
        return res.data;
      } catch (err) {
        const status = (err as any)?.response?.status;
        // If PATCH not allowed (405), try POST to same path. Do NOT fallback to POST on 400
        // since 400 usually means validation error and POST will likely be 405.
        if (status === 405) {
          // Let axios automatically set the multipart Content-Type header
          const res2 = await api.post(`/users/${userId}/profile/`, form);
          return res2.data;
        }
        // If 404 or other error, fall through to base64 fallback below
        if (status && status === 404) {
          // no-op: will fall back
        } else {
          throw err;
        }
      }
    } catch (e) {
      // continue to base64 fallback
    }

    // Fallback: encode as base64 and send via updateProfile (some backends expect that)
    const toBase64 = (fileToRead: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileToRead);
    });
    const dataUrl = await toBase64(file);
    return authService.updateProfile(userId, { avatar_base64: dataUrl, avatar_filename: file.name } as any);
  },

  // Change password
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> => {
    return apiUtils.post<{ message: string }>('/users/auth/change-password/', data);
  },

  // Reset password
  resetPassword: async (email: string): Promise<{ message: string }> => {
    return apiUtils.post<{ message: string }>('/users/auth/reset-password/', { email });
  },

  // Verificar se usuário está autenticado
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Obter usuário do localStorage
  getStoredUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined') return null;
    try {
      const user = JSON.parse(userStr) as User;
      // Normalizar dados do usuário para compatibilidade
      // Se vem com perfil como objeto, adicionar role normalizado
      if (user && typeof user === 'object' && 'perfil' in user && user.perfil && typeof user.perfil === 'object' && 'nome' in user.perfil) {
        return {
          ...user,
          role: (user.perfil as any).nome || null,
        } as User;
      }
      return user;
    } catch (e) {
      console.warn('Failed to parse stored user from localStorage', e);
      return null;
    }
  },
};

// --- Proactive refresh scheduler (module-level helpers) ---
let refreshTimeoutId: number | null = null;

function cancelScheduledRefresh() {
  if (refreshTimeoutId !== null) {
    clearTimeout(refreshTimeoutId);
    refreshTimeoutId = null;
  }
}

function scheduleTokenRefresh(accessToken: string) {
  // Decode JWT (base64url) to read `exp` claim (seconds since epoch)
  try {
    const parts = accessToken.split('.');
    if (parts.length < 2) return;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, '=');
    const decoded = JSON.parse(atob(padded));
    const expSeconds = decoded.exp;
    if (!expSeconds) return;

    const expMs = expSeconds * 1000;
    const now = Date.now();
    // Schedule refresh 60 seconds before token expiry (or at half the lifetime if very short)
    let msUntilRefresh = expMs - now - 60_000;
    if (msUntilRefresh < 0) msUntilRefresh = 0;

    cancelScheduledRefresh();
    refreshTimeoutId = window.setTimeout(async () => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const resp = await authService.refreshToken(refreshToken);
        const newAccess = (resp as { access?: string }).access;
        if (newAccess) {
          localStorage.setItem('authToken', newAccess);
          // reschedule next refresh
          scheduleTokenRefresh(newAccess);
        }
      } catch {
        // If proactive refresh fails, let the interceptor handle logout on next request.
        cancelScheduledRefresh();
      }
    }, msUntilRefresh) as unknown as number;
  } catch {
    // ignore parse errors
  }
}