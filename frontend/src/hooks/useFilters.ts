import { useState, useCallback } from 'react';
import api from '../services/api';
import type { Tag } from '../types/api';

interface FilterItem extends Tag {
  id: number;
  name: string;
}

export const useFilters = () => {
  const [tags, setTags] = useState<FilterItem[]>([]);
  const [areas, setAreas] = useState<FilterItem[]>([]);
  const [cargos, setCargos] = useState<FilterItem[]>([]);
  const [unidades, setUnidades] = useState<FilterItem[]>([]);
  const [competencias, setCompetencias] = useState<FilterItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Buscar todas os filtros
   */
  const fetchAllFilters = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [tagsRes, areasRes, cargosRes, unidadesRes, competenciasRes] = await Promise.all([
        api.get<FilterItem[]>('/filtros/tags/'),
        api.get<FilterItem[]>('/filtros/areas/'),
        api.get<FilterItem[]>('/filtros/cargos/'),
        api.get<FilterItem[]>('/filtros/unidades/'),
        api.get<FilterItem[]>('/filtros/competencias/'),
      ]);

      const tagsData = Array.isArray(tagsRes.data) ? tagsRes.data : tagsRes.data.results || [];
      const areasData = Array.isArray(areasRes.data) ? areasRes.data : areasRes.data.results || [];
      const cargosData = Array.isArray(cargosRes.data) ? cargosRes.data : cargosRes.data.results || [];
      const unidadesData = Array.isArray(unidadesRes.data) ? unidadesRes.data : unidadesRes.data.results || [];
      const competenciasData = Array.isArray(competenciasRes.data) ? competenciasRes.data : competenciasRes.data.results || [];

      setTags(tagsData);
      setAreas(areasData);
      setCargos(cargosData);
      setUnidades(unidadesData);
      setCompetencias(competenciasData);

      return { tags: tagsData, areas: areasData, cargos: cargosData, unidades: unidadesData, competencias: competenciasData };
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Falha ao buscar filtros';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Buscar tags
   */
  const fetchTags = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<FilterItem[]>('/filtros/tags/');
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setTags(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Falha ao buscar tags');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Buscar áreas
   */
  const fetchAreas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<FilterItem[]>('/filtros/areas/');
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setAreas(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Falha ao buscar áreas');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Buscar cargos
   */
  const fetchCargos = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<FilterItem[]>('/filtros/cargos/');
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setCargos(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Falha ao buscar cargos');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Buscar unidades
   */
  const fetchUnidades = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<FilterItem[]>('/filtros/unidades/');
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setUnidades(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Falha ao buscar unidades');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Buscar competências
   */
  const fetchCompetencias = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<FilterItem[]>('/filtros/competencias/');
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setCompetencias(data);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Falha ao buscar competências');
      return [];
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
    tags,
    areas,
    cargos,
    unidades,
    competencias,
    isLoading,
    error,
    fetchAllFilters,
    fetchTags,
    fetchAreas,
    fetchCargos,
    fetchUnidades,
    fetchCompetencias,
    clearError,
  };
};
