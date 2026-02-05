import { apiUtils } from './api';
import type {
  Trail,
  TrailFilters,
  PaginatedResponse,
  TrailEnrollment,
} from '../types/api';

export const trailService = {
  // Listar trilhas com filtros
  getTrails: async (filters?: TrailFilters): Promise<PaginatedResponse<Trail>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.isPublic !== undefined) params.append('is_public', filters.isPublic.toString());
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.pageSize) params.append('page_size', filters.pageSize.toString());
      if (filters.ordering) params.append('ordering', filters.ordering);
      if (filters.tags?.length) {
        filters.tags.forEach(tag => params.append('tags', tag.toString()));
      }
    }

    const queryString = params.toString();
    return apiUtils.get<PaginatedResponse<Trail>>(`/trilhas/${queryString ? `?${queryString}` : ''}`);
  },

  // Obter trilha por ID
  getTrailById: async (id: number): Promise<Trail> => {
    return apiUtils.get<Trail>(`/trilhas/${id}/`);
  },

  // Criar nova trilha
  createTrail: async (data: Omit<Trail, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<Trail> => {
    return apiUtils.post<Trail>('/trilhas/create/', data);
  },

  // Atualizar trilha
  updateTrail: async (id: number, data: Partial<Trail>): Promise<Trail> => {
    return apiUtils.patch<Trail>(`/trilhas/${id}/`, data);
  },

  // Deletar trilha
  deleteTrail: async (id: number): Promise<void> => {
    return apiUtils.delete<void>(`/trilhas/${id}/`);
  },

  // Duplicar trilha
  duplicateTrail: async (id: number): Promise<Trail> => {
    return apiUtils.post<Trail>(`/trilhas/${id}/duplicate/`);
  },

  // Publicar trilha (alterar status para ativo)
  publishTrail: async (id: number): Promise<Trail> => {
    return apiUtils.post<Trail>(`/trilhas/${id}/publish/`);
  },

  // Pausar trilha
  pauseTrail: async (id: number): Promise<Trail> => {
    return apiUtils.post<Trail>(`/trilhas/${id}/pause/`);
  },

  // Arquivar trilha
  archiveTrail: async (id: number): Promise<Trail> => {
    return apiUtils.post<Trail>(`/trilhas/${id}/archive/`);
  },

  // Matricular usuário em trilha
  enrollUser: async (trailId: number, userId?: number): Promise<TrailEnrollment> => {
    return apiUtils.post<TrailEnrollment>(`/trilhas/${trailId}/enroll/`, userId ? { userId } : {});
  },

  // Cancelar matrícula
  unenrollUser: async (trailId: number, userId?: number): Promise<void> => {
    return apiUtils.post<void>(`/trilhas/${trailId}/unenroll/`, userId ? { userId } : {});
  },

  // Obter matrículas de uma trilha
  getTrailEnrollments: async (trailId: number): Promise<PaginatedResponse<TrailEnrollment>> => {
    return apiUtils.get<PaginatedResponse<TrailEnrollment>>(`/trilhas/${trailId}/enrollments/`);
  },

  // Upload de thumbnail da trilha
  uploadThumbnail: async (trailId: number, file: File): Promise<{ thumbnail: string }> => {
    return apiUtils.upload<{ thumbnail: string }>(`/trilhas/${trailId}/thumbnail/`, file);
  },

  // Obter trilhas do usuário (matrículas)
  getUserTrails: async (userId?: number): Promise<PaginatedResponse<TrailEnrollment>> => {
    const url = userId ? `/users/${userId}/trails/` : '/user/trails/';
    return apiUtils.get<PaginatedResponse<TrailEnrollment>>(url);
  },

  // Obter estatísticas da trilha
  getTrailStats: async (trailId: number): Promise<{
    totalEnrollments: number;
    completedEnrollments: number;
    completionRate: number;
    averageScore: number;
    averageTimeSpent: number;
  }> => {
    return apiUtils.get(`/trilhas/${trailId}/stats/`);
  },
};