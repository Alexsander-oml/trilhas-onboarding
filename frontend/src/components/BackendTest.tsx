import { useState } from 'react';
import api from '../services/api';

export const BackendTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testEndpoint = async (endpoint: string, method: 'GET' | 'POST' = 'GET') => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      let response;
      if (method === 'GET') {
        response = await api.get(endpoint);
      } else {
        response = await api.post(endpoint);
      }

      setResult(JSON.stringify(response.data, null, 2));
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message;
      setError(`Erro: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 rounded-lg bg-white p-8 shadow">
      <h2 className="text-2xl font-bold">Tester de Integração Backend</h2>
      <p className="text-sm text-gray-600">
        Base URL: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}
      </p>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Endpoints Disponíveis</h3>

        <div className="grid gap-3">
          <button
            onClick={() => testEndpoint('/trilhas/search/')}
            disabled={loading}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            GET /trilhas/search/
          </button>

          <button
            onClick={() => testEndpoint('/filtros/tags/')}
            disabled={loading}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            GET /filtros/tags/
          </button>

          <button
            onClick={() => testEndpoint('/filtros/areas/')}
            disabled={loading}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            GET /filtros/areas/
          </button>

          <button
            onClick={() => testEndpoint('/filtros/cargos/')}
            disabled={loading}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            GET /filtros/cargos/
          </button>

          <button
            onClick={() => testEndpoint('/questoes/search/')}
            disabled={loading}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            GET /questoes/search/
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <span>Carregando...</span>
        </div>
      )}

      {error && (
        <div className="rounded bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Erro:</p>
          <pre className="mt-2 overflow-auto text-xs">{error}</pre>
        </div>
      )}

      {result && (
        <div className="rounded bg-green-50 p-4">
          <p className="font-semibold text-green-900">Resposta:</p>
          <pre className="mt-2 overflow-auto rounded bg-white p-2 text-xs font-mono">{result}</pre>
        </div>
      )}
    </div>
  );
};
