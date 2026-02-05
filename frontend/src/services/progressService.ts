import { apiUtils } from './api';
import type {
  ModuleProgress,
  MaterialProgress,
  QuizAttempt,
  QuizAnswer,
  UserProgressSummary,
  TrailEnrollment,
} from '../types/api';

// Listar matrículas do usuário atual (ou opcionalmente de outro usuário)
export const getUserEnrollments = async (
  userId?: number,
): Promise<Array<{ trail_id: number; enrollment_id?: number }>> => {
  const url = userId ? `/users/${userId}/enrollments/` : '/users/enrollments/';
  return apiUtils.get(url);
};

export const progressService = {
  // Reexportar para manter compatibilidade com chamadas progressService.getUserEnrollments
  getUserEnrollments,
  // ===== PROGRESSO DE TRILHA =====
  
  // Obter progresso do usuário em uma trilha
  getTrailProgress: async (trailId: number, userId?: number): Promise<TrailEnrollment> => {
    const url = userId 
      ? `/trails/${trailId}/progress/?user=${userId}`
      : `/trails/${trailId}/progress/`;
    return apiUtils.get<TrailEnrollment>(url);
  },

  // Inicializar progresso de trilha
  initializeTrailProgress: async (trailId: number, userId?: number): Promise<TrailEnrollment> => {
    return apiUtils.post<TrailEnrollment>(`/trails/${trailId}/progress/initialize/`, 
      userId ? { userId } : {}
    );
  },

  // ===== PROGRESSO DE MÓDULO =====
  
  // Obter progresso de módulos
  getModuleProgress: async (enrollmentId: number): Promise<ModuleProgress[]> => {
    return apiUtils.get<ModuleProgress[]>(`/enrollments/${enrollmentId}/modules/`);
  },

  // Atualizar progresso de módulo
  updateModuleProgress: async (
    moduleProgressId: number, 
    data: Partial<ModuleProgress>
  ): Promise<ModuleProgress> => {
    return apiUtils.patch<ModuleProgress>(`/module-progress/${moduleProgressId}/`, data);
  },

  // ===== PROGRESSO DE MATERIAL =====
  
  // Obter progresso de materiais de um módulo
  getMaterialProgress: async (moduleProgressId: number): Promise<MaterialProgress[]> => {
    return apiUtils.get<MaterialProgress[]>(`/module-progress/${moduleProgressId}/materials/`);
  },

  // Iniciar material
  startMaterial: async (materialId: number): Promise<MaterialProgress> => {
    return apiUtils.post<MaterialProgress>(`/materials/${materialId}/start/`);
  },

  // Atualizar progresso de material
  updateMaterialProgress: async (
    materialProgressId: number,
    data: {
      progressPercentage?: number;
      timeSpent?: number;
      lastPosition?: number;
      status?: MaterialProgress['status'];
    }
  ): Promise<MaterialProgress> => {
    return apiUtils.patch<MaterialProgress>(`/material-progress/${materialProgressId}/`, data);
  },

  // Marcar material como concluído
  completeMaterial: async (
    materialProgressId: number,
    score?: number
  ): Promise<MaterialProgress> => {
    return apiUtils.post<MaterialProgress>(`/material-progress/${materialProgressId}/complete/`, {
      score,
    });
  },

  // ===== QUIZ =====
  
  // Iniciar tentativa de quiz
  startQuizAttempt: async (materialId: number): Promise<QuizAttempt> => {
    return apiUtils.post<QuizAttempt>(`/materials/${materialId}/quiz/start/`);
  },

  // Responder pergunta do quiz
  answerQuestion: async (
    attemptId: number,
    questionId: number,
    answer: {
      selectedOption?: number;
      textAnswer?: string;
    }
  ): Promise<QuizAnswer> => {
    return apiUtils.post<QuizAnswer>(`/quiz-attempts/${attemptId}/answer/`, {
      questionId,
      ...answer,
    });
  },

  // Finalizar quiz
  finishQuiz: async (attemptId: number): Promise<QuizAttempt> => {
    return apiUtils.post<QuizAttempt>(`/quiz-attempts/${attemptId}/finish/`);
  },

  // Obter tentativas de quiz
  getQuizAttempts: async (materialProgressId: number): Promise<QuizAttempt[]> => {
    return apiUtils.get<QuizAttempt[]>(`/material-progress/${materialProgressId}/quiz-attempts/`);
  },

  // Obter detalhes de uma tentativa
  getQuizAttemptDetails: async (attemptId: number): Promise<QuizAttempt> => {
    return apiUtils.get<QuizAttempt>(`/quiz-attempts/${attemptId}/`);
  },

  // ===== RESUMO E ESTATÍSTICAS =====
  
  // Obter resumo do progresso do usuário
  getUserProgressSummary: async (userId?: number): Promise<UserProgressSummary> => {
    const url = userId ? `/users/${userId}/progress-summary/` : '/user/progress-summary/';
    return apiUtils.get<UserProgressSummary>(url);
  },

  // Obter progresso detalhado de uma trilha
  getDetailedTrailProgress: async (
    trailId: number, 
    userId?: number
  ): Promise<{
    enrollment: TrailEnrollment;
    modules: Array<ModuleProgress & {
      materials: MaterialProgress[];
    }>;
  }> => {
    const url = userId 
      ? `/trails/${trailId}/detailed-progress/?user=${userId}`
      : `/trails/${trailId}/detailed-progress/`;
    return apiUtils.get(url);
  },

  // Resumir progresso (onde o usuário parou)
  resumeProgress: async (trailId: number, userId?: number): Promise<{
    moduleId?: number;
    materialId?: number;
    lastAccessed?: string;
  }> => {
    const url = userId 
      ? `/trails/${trailId}/resume/?user=${userId}`
      : `/trails/${trailId}/resume/`;
    return apiUtils.get(url);
  },

  // Salvar ponto de retomada
  saveResumePoint: async (
    trailId: number,
    moduleId: number,
    materialId: number,
    userId?: number
  ): Promise<void> => {
    return apiUtils.post(`/trails/${trailId}/save-resume/`, {
      moduleId,
      materialId,
      userId,
    });
  },

  // ===== RELATÓRIOS =====
  
  // Gerar relatório de progresso de trilha
  generateTrailProgressReport: async (trailId: number): Promise<{
    reportUrl: string;
    fileName: string;
  }> => {
    return apiUtils.post(`/trails/${trailId}/progress-report/`);
  },

  // Gerar relatório de usuário
  generateUserProgressReport: async (userId: number): Promise<{
    reportUrl: string;
    fileName: string;
  }> => {
    return apiUtils.post(`/users/${userId}/progress-report/`);
  },
};

// Export default para compatibilidade com imports existentes
export default progressService;