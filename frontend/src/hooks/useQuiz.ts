import { useState, useCallback } from 'react';
import api from '../services/api';

interface QuizData {
  id: number;
  titulo: string;
  descricao?: string;
  questoes?: any[];
}

interface TentativaQuizData {
  id: number;
  quiz: number;
  usuario: number;
  data_inicio: string;
  data_fim?: string;
  score?: number;
  status: string;
}

export const useQuiz = () => {
  const [quizzes, setQuizzes] = useState<QuizData[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<QuizData | null>(null);
  const [attempts, setAttempts] = useState<TentativaQuizData[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Buscar todos os quiz
   */
  const fetchQuizzes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<QuizData[]>('/quiz/');
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setQuizzes(data);
      return data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Falha ao buscar quiz';
      setError(errorMsg);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Obter quiz por ID
   */
  const getQuiz = useCallback(async (id: number): Promise<QuizData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<QuizData>(`/quiz/${id}/`);
      setCurrentQuiz(response.data);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Falha ao buscar quiz';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Iniciar tentativa de quiz
   */
  const startAttempt = useCallback(async (quizId: number): Promise<TentativaQuizData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<TentativaQuizData>(`/tentativas/${quizId}/iniciar/`, {});
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Falha ao iniciar tentativa';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Obter próxima questão
   */
  const getNextQuestion = useCallback(async (attemptId: number): Promise<any | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/tentativas/${attemptId}/questao/`);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Falha ao obter questão';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Responder questão
   */
  const answerQuestion = useCallback(
    async (attemptId: number, questionId: number, answer: any): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        await api.post(`/tentativas/${attemptId}/responder/`, {
          questao_id: questionId,
          resposta: answer,
        });
        return true;
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || 'Falha ao responder questão';
        setError(errorMsg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Finalizar tentativa
   */
  const finishAttempt = useCallback(async (attemptId: number): Promise<TentativaQuizData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post<TentativaQuizData>(`/tentativas/${attemptId}/finalizar/`, {});
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Falha ao finalizar tentativa';
      setError(errorMsg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Obter histórico de tentativas
   */
  const fetchAttempts = useCallback(async (quizId?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      let url = '/tentativas/';
      if (quizId) url += `?quiz=${quizId}`;

      const response = await api.get<TentativaQuizData[]>(url);
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setAttempts(data);
      return data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || 'Falha ao buscar tentativas';
      setError(errorMsg);
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
    quizzes,
    currentQuiz,
    attempts,
    isLoading,
    error,
    fetchQuizzes,
    getQuiz,
    startAttempt,
    getNextQuestion,
    answerQuestion,
    finishAttempt,
    fetchAttempts,
    clearError,
  };
};
