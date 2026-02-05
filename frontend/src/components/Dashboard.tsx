import { useEffect, useState } from 'react';
import { apiUtils } from '../services/api';

export default function Dashboard() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Tentar carregar dados do endpoint /protected/ (opcional, pode não existir)
        try {
          const resp = await apiUtils.get<{ message: string }>('/protected/');
          if (!mounted) return;
          setMessage(resp.message ?? JSON.stringify(resp));
        } catch (err: any) {
          // Ignorar erro se endpoint não existir, continuar com sucesso
          if (err?.response?.status !== 404) {
            throw err;
          }
          if (mounted) {
            setMessage('Bem-vindo ao Dashboard!');
          }
        }
      } catch (err: any) {
        console.error('Dashboard error', err);
        if (mounted) {
          setError(err?.response?.data?.detail || err?.message || 'Erro ao carregar dados');
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      {message && <div className="p-4 bg-green-50 border border-green-200 rounded">{message}</div>}
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded">{error}</div>}
      {!message && !error && <div>Carregando...</div>}
    </div>
  );
}
