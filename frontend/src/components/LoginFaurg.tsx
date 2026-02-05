import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoFaurg from '../assets/FAURG-logo-horizontal-reduzida.png';
import { authService } from '../services/authService';
import type { LoginCredentials } from '../types/api';

export default function LoginFaurg() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLogoLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    (async () => {
      try {
        // Backend espera 'email' e 'password'
        const credentials: LoginCredentials = { email: email.trim(), password };
        await authService.login(credentials);

        // authService já armazenou tokens e usuário no localStorage
        const storedUser = authService.getStoredUser();

        // Redirecionar baseado em perfil
        // getStoredUser() normaliza 'role' para compatibilidade
        const role = storedUser?.role || null;
        
        if (role === 'Administrador') {
          navigate('/admin');
        } else if (role === 'Aprendiz') {
          navigate('/aprendiz');
        } else if (role === 'Mentor') {
          navigate('/trails');
        } else if (role === 'Gestor') {
          navigate('/admin');
        } else if (role === 'Autor de Conteúdo') {
          navigate('/trails');
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Login error', err);
        const axiosErr = err as {
          response?: { data?: any };
          message?: string;
        };
        const data = axiosErr?.response?.data;
        const firstFieldError = (() => {
          if (data && typeof data === 'object') {
            for (const key of Object.keys(data)) {
              const val = data[key];
              if (typeof val === 'string') return val;
              if (Array.isArray(val) && val.length > 0) return val[0];
            }
          }
          return undefined;
        })();
        const serverMsg =
          data?.detail ||
          data?.message ||
          data?.non_field_errors?.[0] ||
          firstFieldError ||
          axiosErr?.message;
        setError(serverMsg || 'Usuário ou senha incorretos');
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return (
    <div className="min-h-screen w-screen bg-gray-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
        <div className="flex justify-center items-center h-32 bg-gradient-to-b from-gray-50 to-white px-6 py-8">
          <div
            className={`transition-all duration-1000 ease-out transform ${
              logoLoaded
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-4 scale-95'
            }`}
          >
            <img
              src={logoFaurg}
              alt="FAURG"
              className="h-20 w-auto object-contain drop-shadow-sm"
              onLoad={() => setLogoLoaded(true)}
            />
          </div>
        </div>
        <div className="p-8 pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="E-mail ou usuário"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 placeholder-gray-400 transition-all duration-200"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 placeholder-gray-400 transition-all duration-200"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-md transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer hover:shadow-lg disabled:transform-none"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
            <div className="text-center pt-2">
              <Link to="/forgot-password" className="text-blue-900 text-sm hover:underline transition-colors duration-200">
                Esqueci minha senha
              </Link>
            </div>
            
            {/* Informações de teste - remover em produção */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 text-xs text-center">
                <strong>Para teste:</strong> Use "admin" como usuário e senha
              </p>
            </div>
          </form>
          <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <p className="text-gray-500 text-sm">© FAURG 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}
