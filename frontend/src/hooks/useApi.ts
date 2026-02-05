import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { trailService } from '../services/trailService';
import { progressService } from '../services/progressService';
import type {
  Trail,
  TrailFilters,
  LoginCredentials,
  RegisterData,
} from '../types/api';

// ===== KEYS PARA CACHE =====
export const queryKeys = {
  // Auth
  currentUser: ['auth', 'current-user'] as const,
  
  // Trails
  trails: (filters?: TrailFilters) => ['trails', filters] as const,
  trail: (id: number) => ['trails', id] as const,
  trailEnrollments: (id: number) => ['trails', id, 'enrollments'] as const,
  trailStats: (id: number) => ['trails', id, 'stats'] as const,
  
  // User trails
  userTrails: (userId?: number) => ['user-trails', userId] as const,
  
  // Progress
  trailProgress: (trailId: number, userId?: number) => 
    ['trail-progress', trailId, userId] as const,
  moduleProgress: (enrollmentId: number) => 
    ['module-progress', enrollmentId] as const,
  materialProgress: (moduleProgressId: number) => 
    ['material-progress', moduleProgressId] as const,
  userProgressSummary: (userId?: number) => 
    ['user-progress-summary', userId] as const,
  quizAttempts: (materialProgressId: number) => 
    ['quiz-attempts', materialProgressId] as const,
};

// ===== AUTH HOOKS =====

export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: authService.getCurrentUser,
    enabled: authService.isAuthenticated(),
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      // Atualizar cache do usuário atual
      queryClient.setQueryData(queryKeys.currentUser, data.user);
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Limpar todo o cache ao fazer logout
      queryClient.clear();
    },
  });
};

// ===== TRAIL HOOKS =====

export const useTrails = (filters?: TrailFilters) => {
  return useQuery({
    queryKey: queryKeys.trails(filters),
    queryFn: () => trailService.getTrails(filters),
  });
};

export const useTrail = (id: number) => {
  return useQuery({
    queryKey: queryKeys.trail(id),
    queryFn: () => trailService.getTrailById(id),
    enabled: !!id,
  });
};

export const useCreateTrail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Trail, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => 
      trailService.createTrail(data),
    onSuccess: () => {
      // Invalidar cache das trilhas para refetch
      queryClient.invalidateQueries({ queryKey: ['trails'] });
    },
  });
};

export const useUpdateTrail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Trail> }) => 
      trailService.updateTrail(id, data),
    onSuccess: (updatedTrail) => {
      // Atualizar cache específico da trilha
      queryClient.setQueryData(queryKeys.trail(updatedTrail.id), updatedTrail);
      // Invalidar lista de trilhas
      queryClient.invalidateQueries({ queryKey: ['trails'] });
    },
  });
};

export const useDeleteTrail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => trailService.deleteTrail(id),
    onSuccess: (_, deletedId) => {
      // Remover do cache
      queryClient.removeQueries({ queryKey: queryKeys.trail(deletedId) });
      // Invalidar lista de trilhas
      queryClient.invalidateQueries({ queryKey: ['trails'] });
    },
  });
};

export const useEnrollTrail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ trailId, userId }: { trailId: number; userId?: number }) => 
      trailService.enrollUser(trailId, userId),
    onSuccess: (_, { trailId, userId }) => {
      // Invalidar trilhas do usuário
      queryClient.invalidateQueries({ queryKey: queryKeys.userTrails(userId) });
      // Invalidar matrículas da trilha
      queryClient.invalidateQueries({ queryKey: queryKeys.trailEnrollments(trailId) });
      // Invalidar estatísticas
      queryClient.invalidateQueries({ queryKey: queryKeys.trailStats(trailId) });
    },
  });
};

// ===== USER TRAILS HOOKS =====

export const useUserTrails = (userId?: number) => {
  return useQuery({
    queryKey: queryKeys.userTrails(userId),
    queryFn: () => trailService.getUserTrails(userId),
  });
};

// ===== PROGRESS HOOKS =====

export const useTrailProgress = (trailId: number, userId?: number) => {
  return useQuery({
    queryKey: queryKeys.trailProgress(trailId, userId),
    queryFn: () => progressService.getTrailProgress(trailId, userId),
    enabled: !!trailId,
  });
};

export const useInitializeTrailProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ trailId, userId }: { trailId: number; userId?: number }) => 
      progressService.initializeTrailProgress(trailId, userId),
    onSuccess: (_, { trailId, userId }) => {
      // Invalidar progresso da trilha
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.trailProgress(trailId, userId) 
      });
      // Invalidar trilhas do usuário
      queryClient.invalidateQueries({ queryKey: queryKeys.userTrails(userId) });
    },
  });
};

export const useUpdateMaterialProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      materialProgressId, 
      data 
    }: { 
      materialProgressId: number; 
      data: Parameters<typeof progressService.updateMaterialProgress>[1];
    }) => progressService.updateMaterialProgress(materialProgressId, data),
    onSuccess: (_, { materialProgressId }) => {
      // Invalidar progresso do material
      queryClient.invalidateQueries({ 
        queryKey: ['material-progress', materialProgressId] 
      });
    },
  });
};

export const useCompleteMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ materialProgressId, score }: { materialProgressId: number; score?: number }) => 
      progressService.completeMaterial(materialProgressId, score),
    onSuccess: () => {
      // Invalidar vários caches relacionados
      queryClient.invalidateQueries({ queryKey: ['material-progress'] });
      queryClient.invalidateQueries({ queryKey: ['module-progress'] });
      queryClient.invalidateQueries({ queryKey: ['trail-progress'] });
      queryClient.invalidateQueries({ queryKey: ['user-progress-summary'] });
    },
  });
};

export const useUserProgressSummary = (userId?: number) => {
  return useQuery({
    queryKey: queryKeys.userProgressSummary(userId),
    queryFn: () => progressService.getUserProgressSummary(userId),
  });
};

// ===== QUIZ HOOKS =====

export const useStartQuizAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (materialId: number) => progressService.startQuizAttempt(materialId),
    onSuccess: (_, materialId) => {
      // Invalidar tentativas do quiz
      queryClient.invalidateQueries({ 
        queryKey: ['quiz-attempts', materialId] 
      });
    },
  });
};

export const useAnswerQuestion = () => {
  return useMutation({
    mutationFn: ({ 
      attemptId, 
      questionId, 
      answer 
    }: { 
      attemptId: number; 
      questionId: number; 
      answer: Parameters<typeof progressService.answerQuestion>[2];
    }) => progressService.answerQuestion(attemptId, questionId, answer),
  });
};

export const useFinishQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attemptId: number) => progressService.finishQuiz(attemptId),
    onSuccess: () => {
      // Invalidar caches relacionados ao progresso
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['material-progress'] });
      queryClient.invalidateQueries({ queryKey: ['module-progress'] });
      queryClient.invalidateQueries({ queryKey: ['trail-progress'] });
    },
  });
};