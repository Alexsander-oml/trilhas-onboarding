import { useState, useCallback } from 'react';
import api from '../services/api';
import type { Trail } from '../types/api';

interface UseTrailsOptions {
  search?: string;
  page?: number;
  limit?: number;
  tags?: number[];
  areas?: number[];
}

export const useTrails = () => {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  /**
   * Buscar trilhas com filtros opcionais
   */
  const fetchTrails = useCallback(async (options: UseTrailsOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.search) params.append('search', options.search);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.tags?.length) params.append('tags', options.tags.join(','));
      if (options.areas?.length) params.append('areas', options.areas.join(','));

      const response = await api.get<any>(`/trilhas/search/?${params}`);
      
      // Handle different response formats
      // Backend retorna: {perfil: "...", total: X, trilhas: [...]}
      let rawData = [];
      if (Array.isArray(response.data)) {
        rawData = response.data;
      } else if (response.data.trilhas) {
        rawData = response.data.trilhas;
      } else if (response.data.results) {
        rawData = response.data.results;
      }
      
      const count = response.data.total || response.data.count || rawData.length;

      // Mapear campos do backend (português) para frontend (inglês)
      const mappedData = rawData.map((trail: any) => {
        // Preferir data_vigencia_fim já no formato ISO; nunca usar inteiros de prazo_recomendado como data
        const vigenciaFim = trail.data_vigencia_fim;
        const deadlineIso = typeof vigenciaFim === 'string' && vigenciaFim.length >= 10
          ? vigenciaFim.slice(0, 10)
          : '';

        // TAGS: usar backend; fallback opcional só para tags/deadline vindos do changelog
        const tagsFromBackend = trail.tags ?? [];
        let tagsFromChangelog: any[] | undefined;
        let deadlineFromChangelog: string | undefined;
        if ((!Array.isArray(tagsFromBackend) || tagsFromBackend.length === 0) && typeof trail.changelog === 'string' && trail.changelog.trim()) {
          try {
            const parsed = JSON.parse(trail.changelog);
            if (parsed && typeof parsed === 'object') {
              if (Array.isArray(parsed.tags)) tagsFromChangelog = parsed.tags;
              if (typeof parsed.deadline === 'string') deadlineFromChangelog = parsed.deadline;
            }
          } catch {
            // ignore
          }
        }

        // MÓDULOS: manter array vindo do backend e expor contagem derivada (ou do backend)
        const modules = Array.isArray(trail.modules) ? trail.modules : [];
        const modulesCount = typeof trail.total_modulos === 'number' ? trail.total_modulos : modules.length;

        return {
          id: trail.id || trail.id_trilha,
          name: trail.titulo || '',
          description: trail.descricao || '',
          objectives: trail.objetivos || '',
          targetAudience: trail.publico_alvo || '',
          deadline: deadlineIso || deadlineFromChangelog || '',
          status: trail.status || 'Rascunho',
          tags: tagsFromChangelog ?? tagsFromBackend ?? [],
          rawTags: trail.tags,
          areas: trail.areas || [],
          cargos: trail.cargos || [],
          unidades: trail.unidades || [],
          competencias: trail.competencias || [],
          createdAt: trail.data_vigencia_inicio || new Date().toISOString(),
          updatedAt: trail.data_vigencia_fim || new Date().toISOString(),
          modules,
          modulesCount,
          moduleCount: modulesCount,
          total_modulos: modulesCount,
          changelog: trail.changelog,
          inscricoes: '0',
          taxaConclusao: 0,
          prazo: trail.prazo_recomendado ? `${trail.prazo_recomendado} dias` : 'Sem prazo',
          department: trail.unidades?.length > 0 ? trail.unidades[0].nome : undefined,
        };
      });

      setTrails(mappedData);
      setTotal(count);
      return mappedData;
    } catch (err: any) {
      console.error('❌ Erro ao buscar trilhas:', err);
      const errorMsg = err.response?.data?.detail || 'Falha ao buscar trilhas';
      setError(errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Obter trail por ID
   */
  const getTrail = useCallback(async (id: number): Promise<Trail | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Sempre usar endpoint detalhado para obter materiais
      const response = await api.get<any>(`/trilhas/${id}/detalhada/`);
      const trail = response.data;
      
      const vigenciaFim = trail.data_vigencia_fim;
      const deadlineIso = typeof vigenciaFim === 'string' && vigenciaFim.length >= 10
        ? vigenciaFim.slice(0, 10)
        : '';

      // TAGS: usar backend; fallback opcional só para tags/deadline vindos do changelog
      const tagsFromBackend = trail.tags ?? [];
      let tagsFromChangelog: any[] | undefined;
      let deadlineFromChangelog: string | undefined;
      if ((!Array.isArray(tagsFromBackend) || tagsFromBackend.length === 0) && typeof trail.changelog === 'string' && trail.changelog.trim()) {
        try {
          const parsed = JSON.parse(trail.changelog);
          if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.tags)) tagsFromChangelog = parsed.tags;
            if (typeof parsed.deadline === 'string') deadlineFromChangelog = parsed.deadline;
          }
        } catch {
          // ignore
        }
      }

      // MÓDULOS: manter array vindo do backend e expor contagem derivada (ou do backend)
      const modules = Array.isArray(trail.modules) ? trail.modules : [];
      const modulesCount = typeof trail.total_modulos === 'number' ? trail.total_modulos : modules.length;

      const mappedTrail: Trail = {
        id: trail.id || trail.id_trilha,
        name: trail.titulo || trail.name || '',
        description: trail.descricao || trail.description || '',
        objectives: trail.objetivos || trail.objectives || '',
        targetAudience: trail.publico_alvo || trail.targetAudience || '',
        deadline: deadlineIso || deadlineFromChangelog || trail.deadline || '',
        status: trail.status || 'Rascunho',
        tags: tagsFromChangelog ?? tagsFromBackend ?? [],
        areas: trail.areas || [],
        cargos: trail.cargos || [],
        unidades: trail.unidades || [],
        competencias: trail.competencias || [],
        createdAt: trail.data_vigencia_inicio || new Date().toISOString(),
        updatedAt: trail.data_vigencia_fim || new Date().toISOString(),
        modules,
        modulesCount,
        moduleCount: modulesCount,
        total_modulos: modulesCount,
        rawTags: trail.tags,
        changelog: trail.changelog,
        // Campos extras esperados em outros componentes
        inscricoes: '0',
        taxaConclusao: 0,
        prazo: trail.prazo_recomendado ? `${trail.prazo_recomendado} dias` : 'Sem prazo',
        department: trail.unidades?.length > 0 ? trail.unidades[0].nome : undefined,
      } as Trail;
      
      return mappedTrail;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Falha ao buscar trilha';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Criar nova trilha
   */
  const createTrail = useCallback(
    async (trailData: Partial<Trail>): Promise<Trail | null> => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('📤 Enviando trilha:', trailData);
        
        // Verificar se os dados já vêm formatados (em português) ou precisam ser mapeados
        const isAlreadyFormatted = (trailData as any).titulo !== undefined;
        
        let backendData;
        if (isAlreadyFormatted) {
          // Dados já vêm formatados do TrailEditor
          backendData = trailData;
          console.log('✅ Dados já formatados em português');
        } else {
          // Mapear campos do frontend (inglês) para backend (português)
          backendData = {
            titulo: (trailData as any).name || '',
            descricao: (trailData as any).description || '',
            objetivos: (trailData as any).objectives || '',
            publico_alvo: (trailData as any).targetAudience || '',
            prazo_recomendado: (trailData as any).deadline ? parseInt((trailData as any).deadline) : null,
            versao: '1.0',
            status: (trailData as any).status || 'Rascunho',
            changelog: JSON.stringify({
              modules: (trailData as any).modules || [],
              tags: (trailData as any).tags || [],
              deadline: (trailData as any).deadline || null,
            }),
          };
        }
        
        console.log('📤 Dados formatados para backend:', backendData);
        
        const response = await api.post<Trail>('/trilhas/create/', backendData);
        
        console.log('✅ Trilha criada:', response.data);
        
        setTrails((prev) => [...prev, response.data]);
        return response.data;
      } catch (err: any) {
        console.error('❌ Erro ao criar trilha:', err);
        console.error('❌ Resposta do servidor:', err.response?.data);
        const errorMsg = err.response?.data?.detail || 'Falha ao criar trilha';
        setError(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Atualizar trilha
   */
  const updateTrail = useCallback(
    async (id: number, trailData: Partial<Trail>): Promise<Trail | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Verificar se os dados já vêm formatados (em português) ou precisam ser mapeados
        const isAlreadyFormatted = (trailData as any).titulo !== undefined;
        
        let backendData: any;
        if (isAlreadyFormatted) {
          // Dados já vêm formatados do TrailEditor
          backendData = trailData;
        } else {
          // Mapear campos do frontend (inglês) para backend (português)
          backendData = {
            versao: (trailData as any).versao || '1.0',
            status: (trailData as any).status || 'Rascunho',
            titulo: (trailData as any).name ?? '',
            descricao: (trailData as any).description ?? '',
            objetivos: (trailData as any).objectives ?? '',
            publico_alvo: (trailData as any).targetAudience ?? '',
            prazo_recomendado: (trailData as any).deadline ? parseInt((trailData as any).deadline) : null,
            changelog: JSON.stringify({
              modules: (trailData as any).modules || [],
              tags: (trailData as any).tags || [],
              deadline: (trailData as any).deadline || null,
            }),
          };
        }
        
        const response = await api.put<Trail>(`/trilhas/${id}/`, backendData);
        setTrails((prev) => prev.map((t) => (t.id === id ? response.data : t)));
        return response.data;
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || 'Falha ao atualizar trilha';
        setError(errorMsg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Deletar trilha
   */
  const deleteTrail = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await api.delete(`/trilhas/${id}/`);
      setTrails((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Falha ao deletar trilha';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    trails,
    isLoading,
    error,
    total,
    fetchTrails,
    getTrail,
    createTrail,
    updateTrail,
    deleteTrail,
    clearError,
  };
};
