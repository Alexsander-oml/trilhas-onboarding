/**
 * Configuração e Setup Recomendados
 * Para o sistema de certificação funcionar perfeitamente
 */

// ============================================================================
// 1. PATHS (tsconfig.json)
// ============================================================================

/*

Para facilitar imports, adicione ao tsconfig.json:

{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@services/*": ["src/services/*"],
      "@types/*": ["src/types/*"]
    }
  }
}

Depois use:
import { useCertificates } from '@hooks/useCertificates';
import { CertificatePreview } from '@components/CertificatePreview';

*/

// ============================================================================
// 2. VITE CONFIG (vite.config.ts)
// ============================================================================

/*

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
    }
  }
});

*/

// ============================================================================
// 3. ENVIRONMENT VARIABLES (.env)
// ============================================================================

/*

# Backend API
VITE_API_URL=http://127.0.0.1:8000
VITE_API_BASE_PATH=/api

# Features
VITE_ENABLE_CERTIFICATES=true
VITE_ENABLE_OFFLINE_MODE=true

# Storage
VITE_STORAGE_PREFIX=trilhas_onboarding

# Certificados
VITE_CERTIFICATE_STORAGE_KEY=certificates
VITE_CERTIFICATE_AUTO_GENERATE=true

*/

// ============================================================================
// 4. VARIABLES TYPESCRIPT (env.d.ts)
// ============================================================================

/*

Crie src/env.d.ts:

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_BASE_PATH: string;
  readonly VITE_ENABLE_CERTIFICATES: string;
  readonly VITE_ENABLE_OFFLINE_MODE: string;
  readonly VITE_STORAGE_PREFIX: string;
  readonly VITE_CERTIFICATE_STORAGE_KEY: string;
  readonly VITE_CERTIFICATE_AUTO_GENERATE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

*/

// ============================================================================
// 5. ATUALIZAR SERVICE PARA USAR ENV
// ============================================================================

/*

No certificates.service.ts, adicione:

const STORAGE_KEY = import.meta.env.VITE_CERTIFICATE_STORAGE_KEY || "certificates";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const API_PATH = import.meta.env.VITE_API_BASE_PATH || "/api";

// Usar em chamadas:
const url = `${API_BASE}${API_PATH}/certificates/`;

*/

// ============================================================================
// 6. TESTING (package.json scripts)
// ============================================================================

/*

"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest",                    // Se quiser adicionar testes
  "test:coverage": "vitest --coverage" // Para cobertura de testes
}

*/

// ============================================================================
// 7. ESTILOS GLOBAIS (App.css)
// ============================================================================

/*

Adicione ao seu App.css ou globals.css:

/* Certificados - Print Friendly */
@media print {
  body {
    margin: 0;
    padding: 0;
    background: white;
  }
  
  .no-print {
    display: none !important;
  }
  
  #certificate-content {
    background: white !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  @page {
    margin: 0;
    size: A4;
  }
}

*/

// ============================================================================
// 8. TAILWIND CONFIG (tailwind.config.ts)
// ============================================================================

/*

Se usar Tailwind, adicione customizações:

export default {
  theme: {
    extend: {
      colors: {
        certificate: {
          gold: '#D4AF37',
          dark: '#1A1A1A',
          border: '#8B6914',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        formal: ['Garamond', 'serif'],
      }
    }
  }
}

*/

// ============================================================================
// 9. MIDDLEWARE PARA AUTENTICAÇÃO (Opcional)
// ============================================================================

/*

Se usar autenticação, adicione ao API service:

// src/services/api.ts

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Adicionar token JWT automaticamente
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

*/

// ============================================================================
// 10. CONTEXT PARA USER (Se não tiver)
// ============================================================================

/*

Crie src/contexts/AuthContext.tsx:

import React, { createContext, useContext, useState } from 'react';

interface User {
  id: number;
  username: string;
  nome_completo: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: User) => setUser(userData);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}

*/

// ============================================================================
// 11. APP.tsx SETUP
// ============================================================================

/*

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import TrailDetail from './pages/TrailDetail';
import MyCertificates from './pages/MyCertificates';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/trail/:id" element={<TrailDetail />} />
          <Route path="/certificados" element={<MyCertificates />} />
          {/* Outras rotas */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

*/

// ============================================================================
// 12. ESLINT CONFIG (.eslintrc)
// ============================================================================

/*

Se usar ESLint, ignore warnings do certificado:

{
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "react-hooks/exhaustive-deps": [
      "warn",
      {
        "additionalHooks": "(useCertificates)"
      }
    ]
  }
}

*/

// ============================================================================
// 13. PRETTIER CONFIG (.prettierrc)
// ============================================================================

/*

{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}

*/

// ============================================================================
// 14. DOCKER (Opcional)
// ============================================================================

/*

Crie Dockerfile na raiz do frontend:

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 5174
CMD ["npm", "run", "preview"]

Crie docker-compose.yml:

version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "5174:5174"
    environment:
      VITE_API_URL: http://backend:8000
  
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: trilhas
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password

*/

// ============================================================================
// 15. PERFORMANCE TIPS
// ============================================================================

/*

1. Lazy load componentes:
   const CertificatePreview = lazy(() => import('./CertificatePreview'));

2. Memoize callbacks:
   const handleCertificate = useCallback(() => { ... }, [dependencies]);

3. Split code:
   Dynamic import para páginas de certificados

4. Cache certificados:
   Use React Query para cache automático

5. Otimizar localStorage:
   Limpar certificados antigos periodicamente

*/

export default undefined;
