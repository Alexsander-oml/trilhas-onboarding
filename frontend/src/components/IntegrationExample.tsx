import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTrails } from '../hooks/useTrails';
import { useFilters } from '../hooks/useFilters';

/**
 * Componente exemplo que demonstra como usar os hooks de integração
 * com o backend. Mostra:
 * - Login/logout
 * - Busca de trilhas
 * - Carregamento de filtros
 */
export const IntegrationExample: React.FC = () => {
  const auth = useAuth();
  const { trails, isLoading: trailsLoading, error: trailsError, fetchTrails } = useTrails();
  const { tags, areas, isLoading: filtersLoading, fetchAllFilters } = useFilters();

  // Carregar filtros e trilhas ao montar
  useEffect(() => {
    const loadData = async () => {
      console.log('🔍 Carregando dados...');
      await fetchAllFilters();
      await fetchTrails();
      console.log('✅ Dados carregados');
    };
    loadData();
  }, []);

  const handleLogin = async () => {
    const result = await auth.login({
      username: 'test_user',
      password: 'password123',
    });

    if (result) {
      alert(`Bem-vindo, ${result.firstName}!`);
    } else {
      alert(`Erro: ${auth.error}`);
    }
  };

  const handleSearch = async (query: string) => {
    await fetchTrails({ search: query });
  };

  return (
    <div className="space-y-8 rounded-lg bg-white p-8 shadow">
      <div>
        <h2 className="text-2xl font-bold">Exemplo de Integração</h2>
        <p className="text-sm text-gray-600">
          Demonstra o uso de hooks customizados para comunicação com backend
        </p>
      </div>

      {/* Seção de Autenticação */}
      <div className="space-y-4 border-b pb-6">
        <h3 className="text-lg font-semibold">🔐 Autenticação</h3>
        {auth.isAuthenticated ? (
          <div className="space-y-3 rounded bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-900">
              Você está autenticado como: <strong>{auth.user?.username}</strong>
            </p>
            <p className="text-xs text-green-700">
              Email: {auth.user?.email}
            </p>
            <button
              onClick={auth.logout}
              className="rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Você não está autenticado.</p>
            <button
              onClick={handleLogin}
              disabled={auth.isLoading}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {auth.isLoading ? 'Entrando...' : 'Fazer Login (Demo)'}
            </button>
            {auth.error && (
              <div className="rounded bg-red-50 p-2 text-xs text-red-700">
                Erro: {auth.error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Seção de Filtros */}
      <div className="space-y-4 border-b pb-6">
        <h3 className="text-lg font-semibold">🏷️ Filtros Disponíveis</h3>
        {filtersLoading ? (
          <p className="text-sm text-gray-600">Carregando filtros...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold">Tags ({tags.length})</p>
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 5).map((tag) => (
                  <span key={tag.id} className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800">
                    {tag.name}
                  </span>
                ))}
                {tags.length > 5 && <span className="text-xs text-gray-600">+{tags.length - 5} mais</span>}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Áreas ({areas.length})</p>
              <div className="flex flex-wrap gap-2">
                {areas.slice(0, 5).map((area) => (
                  <span key={area.id} className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-800">
                    {area.name}
                  </span>
                ))}
                {areas.length > 5 && <span className="text-xs text-gray-600">+{areas.length - 5} mais</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Seção de Trilhas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">📚 Trilhas</h3>

        <div className="space-y-2">
          <input
            type="text"
            placeholder="Buscar trilhas..."
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        {trailsLoading ? (
          <p className="text-sm text-gray-600">Carregando trilhas...</p>
        ) : trailsError ? (
          <div className="rounded bg-red-50 p-3 text-sm text-red-700">
            Erro: {trailsError}
          </div>
        ) : trails.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhuma trilha encontrada.</p>
        ) : (
          <div className="space-y-3">
            {trails.map((trail) => (
              <div key={trail.id} className="rounded border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900">{trail.name}</h4>
                <p className="text-sm text-gray-600">{trail.description}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {trail.modules?.length || 0} módulos
                  </span>
                  <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${
                    trail.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : trail.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {trail.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resumo de Estados */}
      <div className="rounded bg-gray-50 p-4">
        <h4 className="text-sm font-semibold text-gray-900">Resumo de Estados</h4>
        <pre className="mt-2 overflow-auto rounded bg-white p-2 text-xs font-mono text-gray-600">
{JSON.stringify(
  {
    auth: {
      isAuthenticated: auth.isAuthenticated,
      user: auth.user?.username,
      isLoading: auth.isLoading,
    },
    trails: {
      count: trails.length,
      isLoading: trailsLoading,
    },
    filters: {
      tags: tags.length,
      areas: areas.length,
      isLoading: filtersLoading,
    },
  },
  null,
  2
)}
        </pre>
      </div>
    </div>
  );
};

export default IntegrationExample;
