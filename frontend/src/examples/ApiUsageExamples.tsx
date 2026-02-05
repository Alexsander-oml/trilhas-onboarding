// ===== EXEMPLOS DE USO DOS HOOKS DE API =====

import React from 'react';
import { useTrails, useCreateTrail, useCurrentUser, useLogin } from '../hooks/useApi';
import { useErrorHandler } from '../contexts/ErrorContext';
import { LoadingSpinner } from '../components/ui/Loading';

// ===== EXEMPLO 1: Listar Trilhas com Filtros =====
const TrailsList: React.FC = () => {
  const { data: paginatedTrails, isLoading, error } = useTrails({
    search: 'onboarding',
    status: 'active',
    page: 1,
    pageSize: 10
  });

  const { showError } = useErrorHandler();

  React.useEffect(() => {
    if (error) {
      showError('Erro ao carregar trilhas');
    }
  }, [error, showError]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <h2>Trilhas ({paginatedTrails?.count || 0})</h2>
      {paginatedTrails?.results.map(trail => (
        <div key={trail.id}>
          <h3>{trail.name}</h3>
          <p>{trail.description}</p>
          <span>Status: {trail.status}</span>
        </div>
      ))}
    </div>
  );
};

// ===== EXEMPLO 2: Criar Nova Trilha =====
const CreateTrailForm: React.FC = () => {
  const createTrail = useCreateTrail();
  const { showSuccess, showError } = useErrorHandler();

  const handleSubmit = async (formData: any) => {
    try {
      const newTrail = await createTrail.mutateAsync({
        name: formData.name,
        description: formData.description,
        objectives: formData.objectives,
        tags: [], // Será array de objetos Tag
        targetAudience: formData.targetAudience,
        deadline: formData.deadline,
        status: 'draft',
        estimatedDuration: formData.duration,
        difficulty: formData.difficulty,
        isPublic: formData.isPublic,
        modules: []
      });
      
      showSuccess(`Trilha "${newTrail.name}" criada com sucesso!`);
      // Navegação ou outras ações
    } catch (error) {
      showError('Erro ao criar trilha');
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleSubmit(Object.fromEntries(formData));
    }}>
      {/* Campos do formulário */}
      <button 
        type="submit" 
        disabled={createTrail.isPending}
      >
        {createTrail.isPending ? 'Criando...' : 'Criar Trilha'}
      </button>
    </form>
  );
};

// ===== EXEMPLO 3: Login com Autenticação =====
const LoginForm: React.FC = () => {
  const login = useLogin();
  const { showError, showSuccess } = useErrorHandler();

  const handleLogin = async (username: string, password: string) => {
    try {
      await login.mutateAsync({ username, password });
      showSuccess('Login realizado com sucesso!');
      // Redirecionamento será automático pelo AuthProvider
    } catch (error) {
      showError('Credenciais inválidas');
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleLogin(
        formData.get('username') as string,
        formData.get('password') as string
      );
    }}>
      <input name="username" type="text" placeholder="Usuário" required />
      <input name="password" type="password" placeholder="Senha" required />
      <button type="submit" disabled={login.isPending}>
        {login.isPending ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
};

// ===== EXEMPLO 4: Progresso do Usuário =====
const UserProgress: React.FC<{ trailId: number }> = ({ trailId }) => {
  const { data: user } = useCurrentUser();
  const { data: progress, isLoading } = useTrailProgress(trailId, user?.id);

  if (isLoading) return <LoadingSpinner />;
  if (!progress) return <div>Nenhum progresso encontrado</div>;

  return (
    <div>
      <h3>Seu Progresso</h3>
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progress.progressPercentage}%` }}
        />
      </div>
      <p>{progress.progressPercentage}% concluído</p>
      <p>Status: {progress.status}</p>
      {progress.completedAt && (
        <p>Concluído em: {new Date(progress.completedAt).toLocaleDateString()}</p>
      )}
    </div>
  );
};

// ===== EXEMPLO 5: Matrícula em Trilha =====
const EnrollButton: React.FC<{ trailId: number }> = ({ trailId }) => {
  const enroll = useEnrollTrail();
  const { showSuccess, showError } = useErrorHandler();

  const handleEnroll = async () => {
    try {
      await enroll.mutateAsync({ trailId });
      showSuccess('Matrícula realizada com sucesso!');
    } catch (error) {
      showError('Erro ao se matricular na trilha');
    }
  };

  return (
    <button 
      onClick={handleEnroll}
      disabled={enroll.isPending}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {enroll.isPending ? 'Matriculando...' : 'Matricular-se'}
    </button>
  );
};

// ===== EXEMPLO 6: Completar Material =====
const CompleteButton: React.FC<{ materialProgressId: number; score?: number }> = ({ 
  materialProgressId, 
  score 
}) => {
  const completeMaterial = useCompleteMaterial();
  const { showSuccess } = useErrorHandler();

  const handleComplete = async () => {
    try {
      await completeMaterial.mutateAsync({ materialProgressId, score });
      showSuccess('Material concluído!');
    } catch (error) {
      console.error('Erro ao completar material:', error);
    }
  };

  return (
    <button 
      onClick={handleComplete}
      disabled={completeMaterial.isPending}
      className="bg-green-500 text-white px-4 py-2 rounded"
    >
      {completeMaterial.isPending ? 'Salvando...' : 'Marcar como Concluído'}
    </button>
  );
};

// ===== EXEMPLO 7: Quiz com Tentativas =====
const QuizComponent: React.FC<{ materialId: number }> = ({ materialId }) => {
  const startQuiz = useStartQuizAttempt();
  const answerQuestion = useAnswerQuestion();
  const finishQuiz = useFinishQuiz();
  const [currentAttempt, setCurrentAttempt] = React.useState<any>(null);

  const handleStartQuiz = async () => {
    try {
      const attempt = await startQuiz.mutateAsync(materialId);
      setCurrentAttempt(attempt);
    } catch (error) {
      console.error('Erro ao iniciar quiz:', error);
    }
  };

  const handleAnswer = async (questionId: number, selectedOption: number) => {
    if (!currentAttempt) return;
    
    try {
      await answerQuestion.mutateAsync({
        attemptId: currentAttempt.id,
        questionId,
        answer: { selectedOption }
      });
    } catch (error) {
      console.error('Erro ao responder:', error);
    }
  };

  const handleFinishQuiz = async () => {
    if (!currentAttempt) return;
    
    try {
      const result = await finishQuiz.mutateAsync(currentAttempt.id);
      console.log('Quiz finalizado:', result);
      setCurrentAttempt(null);
    } catch (error) {
      console.error('Erro ao finalizar quiz:', error);
    }
  };

  if (!currentAttempt) {
    return (
      <button onClick={handleStartQuiz} disabled={startQuiz.isPending}>
        {startQuiz.isPending ? 'Iniciando...' : 'Iniciar Quiz'}
      </button>
    );
  }

  return (
    <div>
      <h3>Quiz em Andamento</h3>
      {/* Renderizar perguntas do quiz */}
      <button onClick={handleFinishQuiz} disabled={finishQuiz.isPending}>
        {finishQuiz.isPending ? 'Finalizando...' : 'Finalizar Quiz'}
      </button>
    </div>
  );
};

// ===== EXEMPLO 8: Error Boundary para API =====
const ApiErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { handleApiError } = useApiErrorHandler();

  React.useEffect(() => {
    // Interceptar erros não capturados do axios
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        handleApiError(error);
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [handleApiError]);

  return <>{children}</>;
};

// ===== EXEMPLO 9: Hook Personalizado para Trilhas do Usuário =====
const useMyTrails = () => {
  const { data: user } = useCurrentUser();
  const { data: userTrails, isLoading } = useUserTrails(user?.id);

  const enrolledTrails = userTrails?.results.filter(
    enrollment => enrollment.status === 'enrolled' || enrollment.status === 'in_progress'
  ) || [];

  const completedTrails = userTrails?.results.filter(
    enrollment => enrollment.status === 'completed'
  ) || [];

  return {
    enrolledTrails,
    completedTrails,
    isLoading,
    totalTrails: userTrails?.count || 0
  };
};

// ===== EXEMPLO 10: Componente de Dashboard do Usuário =====
const UserDashboard: React.FC = () => {
  const { data: user } = useCurrentUser();
  const { data: summary, isLoading } = useUserProgressSummary(user?.id);
  const { enrolledTrails, completedTrails } = useMyTrails();

  if (isLoading) return <LoadingSpinner size="large" />;

  return (
    <div className="dashboard">
      <h1>Olá, {user?.firstName}!</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Trilhas em Andamento</h3>
          <span className="stat-number">{enrolledTrails.length}</span>
        </div>
        
        <div className="stat-card">
          <h3>Trilhas Concluídas</h3>
          <span className="stat-number">{completedTrails.length}</span>
        </div>
        
        <div className="stat-card">
          <h3>Tempo Total</h3>
          <span className="stat-number">
            {Math.round((summary?.totalTimeSpent || 0) / 3600)}h
          </span>
        </div>
        
        <div className="stat-card">
          <h3>Nota Média</h3>
          <span className="stat-number">{summary?.averageScore || 0}%</span>
        </div>
      </div>
      
      <div className="trails-section">
        <h2>Suas Trilhas</h2>
        {enrolledTrails.map(enrollment => (
          <div key={enrollment.id} className="trail-card">
            <h3>{enrollment.trail}</h3>
            <div className="progress-bar">
              <div 
                style={{ width: `${enrollment.progressPercentage}%` }}
                className="progress-fill"
              />
            </div>
            <span>{enrollment.progressPercentage}% concluído</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export {
  TrailsList,
  CreateTrailForm,
  LoginForm,
  UserProgress,
  EnrollButton,
  CompleteButton,
  QuizComponent,
  ApiErrorBoundary,
  useMyTrails,
  UserDashboard
};