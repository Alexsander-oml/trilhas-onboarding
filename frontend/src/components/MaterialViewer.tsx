/**
 * MATERIAL VIEWER - Renderizador Universal de Conteúdos de Aprendizagem
 *
 * FUNCIONALIDADES:
 * - Renderização polimórfica baseada no tipo de material
 * - Sistema de progresso integrado com ProgressContext
 * - Quiz engine completo com embaralhamento e pontuação
 * - Player de vídeo com controle de progresso
 * - Visualizador de PDFs e conteúdo de leitura
 * - Animações suaves para melhor UX
 * - Persistência automática do progresso
 *
 * TIPOS DE MATERIAL SUPORTADOS:
 * - 'video': Player HTML5 com controles customizados
 * - 'pdf': Iframe para visualização de documentos
 * - 'reading': Conteúdo de texto formatado
 * - 'quiz': Sistema completo de avaliação
 *
 * SISTEMA DE QUIZ:
 * - Embaralhamento de perguntas e opções (opcional)
 * - Timer por pergunta e geral
 * - Múltiplas tentativas (configurável)
 * - Tela de revisão sem gabarito
 * - Feedback imediato com explicações
 * - Cálculo automático de pontuação
 * - Persistência de tentativas
 *
 * INTEGRAÇÃO:
 * - ProgressContext para salvar estado
 * - Callback onComplete para notificar conclusão
 * - IDs únicos para rastreamento (trail, module, material, user)
 */

import React, { useState, useEffect, useRef } from "react";
import { useProgress } from "../contexts/ProgressContext";

/**
 * ANIMAÇÕES CSS CUSTOMIZADAS
 * Estilos injetados dinamicamente para evitar dependências externas
 * Animações suaves para transições de estado e feedback visual
 */
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideInDown {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out forwards;
  }
  
  .animate-slideInUp {
    animation: slideInUp 0.6s ease-out forwards;
  }
  
  .animate-slideInDown {
    animation: slideInDown 0.4s ease-out forwards;
  }
  
  .hover\\:scale-102:hover {
    transform: scale(1.02);
  }
`;

// Injeção dinâmica de estilos CSS no head do documento
// Evita duplicação e garante que as animações estejam disponíveis
if (
  typeof document !== "undefined" &&
  !document.getElementById("quiz-animations")
) {
  const style = document.createElement("style");
  style.id = "quiz-animations";
  style.textContent = animationStyles;
  document.head.appendChild(style);
}

/**
 * INTERFACE DO MATERIAL VIEWER
 * Define a estrutura completa de dados necessária para renderizar qualquer tipo de material
 */
interface RawQuestion {
  id?: number | string;
  question?: string;
  pergunta?: string;
  enunciado?: string;
  options?: string[];
  alternativa_a?: string;
  alternativa_b?: string;
  alternativa_c?: string;
  alternativa_d?: string;
  correctAnswer?: number;
  gabarito?: string;
  explanation?: string;
  feedback?: string;
}

interface MaterialViewerProps {
  // === DADOS DO MATERIAL ===
  material: {
    // Identificação básica
    id: number; // ID único do material
    type: string; // Tipo: 'video', 'pdf', 'reading', 'quiz'
    name: string; // Nome/título do material

    // Conteúdo (opcional conforme o tipo)
    url?: string; // URL do arquivo (vídeo, PDF, link externo)
    duration?: number; // Duração estimada em minutos
    description?: string; // Descrição adicional do material

    // IDs para referência ao backend (para quiz)
    id_atividade?: number; // ID da atividade no backend (para quiz)
    quizId?: number; // ID do quiz (alternativa)

    // Configurações pedagógicas (para quizzes principalmente)
    requirements?: {
      minimumScore?: number; // Nota mínima para aprovação (0-100)
      passingScore?: number; // Nota considerada "boa" (pode ser > minimumScore)
      timeLimit?: number; // Tempo limite em minutos (0 = sem limite)
      attemptsAllowed?: number; // Número máximo de tentativas (0 = ilimitado)
    };

    // Dados específicos para quizzes
    quizData?: {
      // Array de perguntas do quiz
      questions: Array<{
        id: number; // ID único da pergunta
        question: string; // Texto da pergunta
        options: string[]; // Array de opções de resposta
        correctAnswer: number; // Índice da resposta correta (0-based)
        explanation?: string; // Explicação da resposta (opcional)
      }>;

      // Configurações do quiz
      passingScore: number; // Nota mínima para aprovação (0-100)
      shuffleQuestions?: boolean; // Embaralhar ordem das perguntas
      shuffleOptions?: boolean; // Embaralhar opções de cada pergunta
    };
  };

  // === CONTEXTO DE EXECUÇÃO ===
  trailId: number; // ID da trilha (para logging/analytics)
  moduleId: number; // ID do módulo (para logging/analytics)
  userId: number; // ID do usuário (para salvar progresso)

  // === CALLBACK DE CONCLUSÃO ===
  onComplete: (score?: number) => void; // Chamado quando material é concluído
  // score: nota obtida (para quizzes)
}

const MaterialViewer: React.FC<MaterialViewerProps> = ({
  material,
  trailId,
  moduleId,
  userId,
  onComplete,
}) => {
  // === HOOKS E CONTEXTOS ===
  const { saveProgress, getUserProgress, updateMaterialProgress } =
    useProgress();

  // === ESTADOS GERAIS DO MATERIAL ===
  const [currentProgress, setCurrentProgress] = useState(0); // Progresso atual (0-100%)
  const [timeSpent, setTimeSpent] = useState(0); // Tempo gasto em segundos
  const [isCompleted, setIsCompleted] = useState(false); // Se material foi concluído

  // === REF PARA CONTROLE DE VÍDEO ===
  const videoRef = useRef<HTMLVideoElement>(null); // Referência do elemento <video>

  // === ESTADOS ESPECÍFICOS DO QUIZ ===
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Pergunta atual (0-based)
  const [answers, setAnswers] = useState<number[]>([]); // Respostas do usuário
  const [showResults, setShowResults] = useState(false); // Mostrar tela de resultados
  const [showReview, setShowReview] = useState(false); // Mostrar tela de revisão
  const [quizStarted, setQuizStarted] = useState(false); // Se quiz foi iniciado
  const [quizData, setQuizData] = useState<{
    questoes_detalhes?: Array<{ questao: Record<string, unknown> }>;
    porcentagem_minima_aprovacao?: number;
    randomizar_questoes?: boolean;
    randomizar_alternativas?: boolean;
  } | null>(null); // Dados do quiz carregados do backend
  const [loadingQuiz, setLoadingQuiz] = useState(false); // Loading state para quiz

  // === PERGUNTAS EMBARALHADAS (se configurado) ===
  const [shuffledQuestions, setShuffledQuestions] = useState<
    Array<{
      id: number | string;
      question: string;
      options: string[];
      correctAnswer: number;
      explanation?: string;
    }>
  >([]); // Array de perguntas após embaralhamento (se habilitado)

  // === TIMER DE TRACKING DE TEMPO ===
  // Conta apenas durante execução ativa do material
  // Para no quiz: durante resultados, revisão, ou se não iniciado
  useEffect(() => {
    // Condições para PAUSAR o timer:
    if (showResults || !quizStarted || showReview) {
      return; // Timer parado
    }

    // Incrementar tempo a cada segundo
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    // Cleanup: limpar interval quando componente desmonta ou dependências mudam
    return () => clearInterval(interval);
  }, [showResults, quizStarted, showReview]); // Reagir a mudanças nestes estados

  // === CARREGAR QUIZ VIA API ===
  // Se material é quiz e tem ID de referência ao backend, buscar dados
  useEffect(() => {
    const loadQuizFromAPI = async () => {
      // Verificar se é um quiz
      if (material.type !== "quiz") {
        return;
      }

      // Se já tem questões no material, não precisa buscar do backend
      if (
        (material as { questoes?: Array<Record<string, unknown>> }).questoes &&
        Array.isArray(
          (material as { questoes?: Array<Record<string, unknown>> }).questoes,
        ) &&
        (material as { questoes?: Array<Record<string, unknown>> }).questoes!
          .length > 0
      ) {
        console.log(
          "✅ Quiz já possui questões, pulando requisição ao backend",
        );
        return;
      }

      // Se tem quizData, também não precisa buscar
      if (
        material.quizData?.questions &&
        material.quizData.questions.length > 0
      ) {
        console.log(
          "✅ Quiz já possui quizData, pulando requisição ao backend",
        );
        return;
      }

      // Usar quizId se disponível (id_quiz do backend)
      const quizId = material.quizId;

      if (!quizId) {
        console.log("ℹ️ Quiz sem quizId - usando dados locais se disponíveis");
        return;
      }

      try {
        setLoadingQuiz(true);
        console.log(`🔍 Carregando quiz do backend: /api/quiz/${quizId}/`);

        // Buscar token do localStorage (authToken é o padrão do sistema)
        const token =
          localStorage.getItem("authToken") ||
          localStorage.getItem("access_token");

        if (!token) {
          console.warn("⚠️ Token de autenticação não encontrado");
          return;
        }

        const response = await fetch(
          `http://localhost:8000/api/quiz/${quizId}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Quiz carregado do backend:", data);
          setQuizData(data);
        } else {
          console.log(
            `ℹ️ Quiz não encontrado no backend (${response.status}) - usando dados locais`,
          );
        }
      } catch (error) {
        console.log(
          "ℹ️ Erro ao carregar quiz do backend - usando dados locais:",
          error,
        );
      } finally {
        setLoadingQuiz(false);
      }
    };

    loadQuizFromAPI();
  }, [material.quizId, material.type]);

  // === INICIALIZAÇÃO E EMBARALHAMENTO DE QUIZ ===
  // Executa uma vez quando material muda ou componente monta
  useEffect(() => {
    // Função auxiliar para mapear questões
    const mapQuestions = (questoes: Array<Record<string, unknown>>) => {
      return questoes.map((q: Record<string, unknown>) => {
        const rawQ = q as RawQuestion;
        return {
          id:
            rawQ.id ||
            (q as { id_questao?: number }).id_questao ||
            Math.random(),
          question: rawQ.question || rawQ.pergunta || rawQ.enunciado || "",
          options:
            rawQ.options && rawQ.options.length > 0
              ? rawQ.options
              : [
                  rawQ.alternativa_a || "",
                  rawQ.alternativa_b || "",
                  rawQ.alternativa_c || "",
                  rawQ.alternativa_d || "",
                ].filter((opt: string) => opt !== ""),
          correctAnswer: (() => {
            if (typeof rawQ.correctAnswer === "number")
              return rawQ.correctAnswer;
            const gabaritoMap: { [key: string]: number } = {
              A: 0,
              B: 1,
              C: 2,
              D: 3,
            };
            return gabaritoMap[rawQ.gabarito?.toUpperCase() ?? "A"] ?? 0;
          })(),
          explanation: rawQ.explanation || rawQ.feedback || "",
        };
      });
    };

    // Usar dados do backend (quizData) se disponível, senão verificar se material tem questoes diretamente
    let dataToUse = null;

    // Verificar questoes_detalhes do backend (formato API /api/quiz/)
    if (quizData?.questoes_detalhes) {
      dataToUse = {
        questions: quizData.questoes_detalhes.map(
          (qq: { questao: Record<string, unknown> }) => {
            const q = qq.questao as RawQuestion;
            return {
              id:
                q.id ||
                (q as { id_questao?: number }).id_questao ||
                Math.random(),
              question: q.question || q.pergunta || q.enunciado || "",
              options:
                q.options && q.options.length > 0
                  ? q.options
                  : [
                      q.alternativa_a || "",
                      q.alternativa_b || "",
                      q.alternativa_c || "",
                      q.alternativa_d || "",
                    ].filter((opt: string) => opt !== ""),
              correctAnswer: (() => {
                if (typeof q.correctAnswer === "number") return q.correctAnswer;
                const gabaritoMap: { [key: string]: number } = {
                  A: 0,
                  B: 1,
                  C: 2,
                  D: 3,
                };
                return gabaritoMap[q.gabarito?.toUpperCase() ?? "A"] ?? 0;
              })(),
              explanation: q.explanation || q.feedback || "",
            };
          },
        ),
        passingScore: quizData.porcentagem_minima_aprovacao || 70,
        shuffleQuestions: quizData.randomizar_questoes,
        shuffleOptions: quizData.randomizar_alternativas,
      };
    }
    // Verificar se material tem questoes diretamente (formato vindo do /api/trails/)
    else if (
      (material as { questoes?: Array<Record<string, unknown>> }).questoes &&
      Array.isArray(
        (material as { questoes?: Array<Record<string, unknown>> }).questoes,
      )
    ) {
      console.log(
        "📚 Usando questões do material:",
        (material as { questoes?: Array<Record<string, unknown>> }).questoes,
      );
      dataToUse = {
        questions: mapQuestions(
          (material as { questoes?: Array<Record<string, unknown>> })
            .questoes as Array<Record<string, unknown>>,
        ),
        passingScore: 70,
        shuffleQuestions: false,
        shuffleOptions: false,
      };
    }
    // Fallback para material.quizData
    else {
      dataToUse = material.quizData;
    }

    if (material.type === "quiz" && dataToUse && dataToUse.questions) {
      console.log(
        `📚 Processando ${dataToUse.questions.length} questões do quiz`,
      );

      let questions = [...dataToUse.questions].map((q: RawQuestion) => {
        // Normalizar formato de questão (backend pode retornar 'pergunta' ou 'question')
        const questionText = q.question || q.pergunta || q.enunciado || "";

        // Construir array de opções a partir das alternativas
        const options =
          q.options && q.options.length > 0
            ? q.options
            : [
                q.alternativa_a || "",
                q.alternativa_b || "",
                q.alternativa_c || "",
                q.alternativa_d || "",
              ].filter((opt: string) => opt !== "");

        // Mapear gabarito para índice de opção (A=0, B=1, C=2, D=3)
        const gabaritoMap: { [key: string]: number } = {
          A: 0,
          B: 1,
          C: 2,
          D: 3,
        };
        const correctAnswer =
          typeof q.correctAnswer === "number"
            ? q.correctAnswer
            : (gabaritoMap[q.gabarito?.toUpperCase() ?? "A"] ?? 0);

        return {
          id: q.id || Math.random(),
          question: questionText,
          options: options,
          correctAnswer: correctAnswer,
          explanation: q.explanation || q.feedback || "",
        };
      });

      // EMBARALHAMENTO DE PERGUNTAS (se configurado)
      if (dataToUse.shuffleQuestions) {
        console.log("🔀 Embaralhando perguntas");
        questions = questions.sort(() => Math.random() - 0.5);
      }

      // EMBARALHAMENTO DE OPÇÕES (se configurado)
      if (dataToUse.shuffleOptions) {
        console.log("🔀 Embaralhando alternativas");
        questions = questions.map((q) => {
          if (!q.options || q.options.length === 0) return q;

          // Embaralhar mantendo o mapeamento correto da resposta
          const optionsWithIndex = q.options
            .map((opt: string, idx: number) => ({ opt, idx }))
            .sort(() => Math.random() - 0.5);

          const newCorrectIndex = optionsWithIndex.findIndex(
            (item: { opt: string; idx: number }) =>
              item.idx === (q.correctAnswer ?? 0),
          );

          return {
            ...q,
            options: optionsWithIndex.map(
              (item: { opt: string; idx: number }) => item.opt,
            ),
            correctAnswer: newCorrectIndex,
          };
        });
      }

      console.log(`✅ Quiz preparado com ${questions.length} questões`);
      setShuffledQuestions(questions);
    }
  }, [material.type, material.quizData, quizData]);

  // Carregar progresso salvo ao montar
  useEffect(() => {
    const userProgress = getUserProgress(userId, trailId);
    if (userProgress) {
      const moduleProgress = userProgress.modulesProgress.find(
        (m) => m.moduleId === moduleId,
      );
      if (moduleProgress) {
        const materialProgress = moduleProgress.materialsProgress.find(
          (m) => m.materialId === material.id,
        );
        if (materialProgress) {
          setCurrentProgress(materialProgress.progress || 0);
          setTimeSpent(materialProgress.timeSpent || 0);
          setIsCompleted(materialProgress.completed);
        }
      }
    }
  }, [userId, trailId, moduleId, material.id, getUserProgress]);

  // Salvar progresso automaticamente
  useEffect(() => {
    if (currentProgress > 0) {
      const timer = setTimeout(() => {
        saveProgress(userId, trailId, moduleId, material.id, currentProgress);
        updateMaterialProgress(userId, trailId, moduleId, material.id, {
          materialId: material.id,
          progress: currentProgress,
          timeSpent,
          completed: isCompleted,
          lastAccessed: new Date(),
        });
      }, 2000); // Salvar após 2 segundos de inatividade

      return () => clearTimeout(timer);
    }
  }, [
    currentProgress,
    timeSpent,
    isCompleted,
    saveProgress,
    updateMaterialProgress,
    userId,
    trailId,
    moduleId,
    material.id,
  ]);

  const renderVideoPlayer = () => {
    const handleTimeUpdate = () => {
      if (videoRef.current) {
        const progress =
          (videoRef.current.currentTime / videoRef.current.duration) * 100;
        setCurrentProgress(progress);

        // Auto-complete quando atingir 95% ou final do vídeo
        if (progress >= 95 || videoRef.current.ended) {
          handleCompletion();
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (videoRef.current && currentProgress > 0) {
        // Retomar de onde parou
        const resumeTime = (currentProgress / 100) * videoRef.current.duration;
        videoRef.current.currentTime = resumeTime;
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-center">
          <video
            ref={videoRef}
            controls
            className="h-auto w-full max-w-4xl rounded-lg shadow-lg"
            style={{
              maxHeight: "60vh",
              aspectRatio: "16/9",
              objectFit: "contain",
            }}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => handleCompletion()}
          >
            <source src={material.url} type="video/mp4" />
            Seu navegador não suporta o elemento de vídeo.
          </video>
        </div>

        {/* Barra de progresso personalizada */}
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${currentProgress}%` }}
          />
        </div>

        <div className="flex justify-between text-sm text-gray-600">
          <span>Progresso: {Math.round(currentProgress)}%</span>
          <span>
            Tempo assistido: {Math.floor(timeSpent / 60)}:
            {(timeSpent % 60).toString().padStart(2, "0")}
          </span>
        </div>
      </div>
    );
  };

  const renderPDFViewer = () => {
    const handleMarkAsRead = () => {
      setCurrentProgress(100);
      handleCompletion();
    };

    return (
      <div className="space-y-4">
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6">
          <div className="text-center">
            <span className="text-4xl">📄</span>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              {material.name}
            </h3>
            <p className="mt-1 text-gray-500">{material.description}</p>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <a
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              🔗 Abrir PDF
            </a>
            <a
              href={material.url}
              download={material.name}
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              📥 Download
            </a>
          </div>
        </div>

        {/* Simulação de progresso de leitura */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Progresso de Leitura
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={currentProgress}
            onChange={(e) => setCurrentProgress(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>{Math.round(currentProgress)}% lido</span>
            <span>
              Tempo: {Math.floor(timeSpent / 60)}:
              {(timeSpent % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>

        {currentProgress >= 90 && (
          <button
            onClick={handleMarkAsRead}
            className="w-full rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            ✓ Marcar como Lido
          </button>
        )}
      </div>
    );
  };

  const renderReadingMaterial = () => {
    const handleScrollProgress = (e: React.UIEvent<HTMLDivElement>) => {
      const element = e.currentTarget;
      const progress =
        ((element.scrollTop + element.clientHeight) / element.scrollHeight) *
        100;
      setCurrentProgress(Math.min(progress, 100));

      if (progress >= 95) {
        handleCompletion();
      }
    };

    return (
      <div className="space-y-4">
        <div
          className="max-h-96 overflow-y-auto rounded-lg border bg-white p-4 shadow"
          onScroll={handleScrollProgress}
        >
          <h3 className="mb-4 text-lg font-semibold">{material.name}</h3>
          <div className="prose max-w-none">
            <p className="mb-4">{material.description}</p>

            {/* Conteúdo simulado */}
            <p className="mb-4">
              Este é um material de leitura importante que contém informações
              essenciais para o seu desenvolvimento profissional. À medida que
              você rola a página, seu progresso será automaticamente salvo.
            </p>

            <h4 className="text-md mb-2 font-medium">Pontos Principais:</h4>
            <ul className="mb-4 list-disc pl-6">
              <li>Conceitos fundamentais do tópico</li>
              <li>Aplicações práticas no dia a dia</li>
              <li>Exemplos e cases de sucesso</li>
              <li>Melhores práticas recomendadas</li>
            </ul>

            <p className="mb-4">
              Continue lendo para absorver todo o conteúdo. Seu progresso está
              sendo monitorado e salvo automaticamente para que você possa
              retomar de onde parou a qualquer momento.
            </p>

            <p className="mb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris.
            </p>

            <p>
              Duis aute irure dolor in reprehenderit in voluptate velit esse
              cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
              cupidatat non proident, sunt in culpa qui officia deserunt mollit
              anim id est laborum.
            </p>
          </div>
        </div>

        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${currentProgress}%` }}
          />
        </div>

        <div className="flex justify-between text-sm text-gray-600">
          <span>Leitura: {Math.round(currentProgress)}%</span>
          <span>
            Tempo: {Math.floor(timeSpent / 60)}:
            {(timeSpent % 60).toString().padStart(2, "0")}
          </span>
        </div>
      </div>
    );
  };

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowReview(true);
    }
  };

  const previousQuestion = () => {
    setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
  };

  const calculateResults = () => {
    // Verificar se todas as questões foram respondidas antes de calcular
    const answeredQuestions = answers.filter(
      (answer) => answer !== undefined,
    ).length;
    if (answeredQuestions < shuffledQuestions.length) {
      console.warn("Tentativa de calcular resultados com questões em branco");
      return;
    }

    const correctAnswers = answers.filter(
      (answer, index) => answer === shuffledQuestions[index].correctAnswer,
    ).length;

    const score = (correctAnswers / shuffledQuestions.length) * 100;
    setCurrentProgress(100);
    setShowResults(true);

    // Sempre salvar o resultado do quiz, independente de ter passado ou não
    updateMaterialProgress(userId, trailId, moduleId, material.id, {
      materialId: material.id,
      completed: score >= (material.quizData?.passingScore || 70),
      progress: 100,
      timeSpent,
      score: Math.round(score),
      attempts: answers.filter((a) => a !== undefined).length > 0 ? 1 : 0,
      lastAccessed: new Date(),
    });

    const passed = score >= (material.quizData?.passingScore || 70);
    if (passed) {
      handleCompletion(score);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setShowResults(false);
    setShowReview(false);
    setTimeSpent(0); // Resetar o tempo ao iniciar o quiz
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setShowResults(false);
    setShowReview(false);
    setTimeSpent(0); // Resetar o tempo ao reiniciar o quiz
  };

  const confirmSubmission = () => {
    // Ir diretamente para a tela de resultados após confirmação
    setShowReview(false);
    calculateResults();
  };

  const backToQuiz = () => {
    setShowReview(false);
    setCurrentQuestionIndex(shuffledQuestions.length - 1);
  };

  const renderQuiz = () => {
    // Se estiver carregando do backend, mostrar loading
    if (loadingQuiz) {
      return (
        <div className="p-8 text-center">
          <div className="inline-block">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Carregando quiz...</p>
          </div>
        </div>
      );
    }

    // Verificar se há dados de quiz do backend
    if (!quizData && shuffledQuestions.length === 0) {
      return (
        <div className="p-8">
          <div className="mx-auto max-w-2xl rounded-lg border-2 border-blue-200 bg-blue-50 p-8">
            <div className="mb-6 text-center">
              <span className="mb-4 block text-5xl">📝</span>
              <h3 className="mb-2 text-2xl font-bold text-gray-900">
                Quiz não configurado
              </h3>
              <p className="text-gray-600">
                Este quiz ainda não possui questões cadastradas
              </p>
            </div>

            <div className="space-y-4 rounded-lg bg-white p-6">
              <div className="rounded bg-gray-50 p-4">
                <p className="mb-3 text-sm text-gray-700">
                  Configure o quiz adicionando questões através do painel de
                  gerenciamento
                </p>
                <button
                  onClick={() => {
                    window.location.href = `/edit-trail/${trailId}`;
                  }}
                  className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-blue-700 active:scale-95"
                >
                  ✏️ Ir para Criar/Gerenciar Quiz
                </button>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-gray-500">
                  💡 Dica: Você pode reutilizar questões já existentes no banco
                  de questões ou criar novas especificamente para este quiz.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Verificar se há questões cadastradas
    const questions =
      shuffledQuestions.length > 0
        ? shuffledQuestions
        : material.quizData?.questions || [];
    if (questions.length === 0 && shuffledQuestions.length === 0) {
      return (
        <div className="p-8 text-center">
          <div className="mx-auto max-w-md rounded-lg border-2 border-yellow-200 bg-yellow-50 p-6">
            <span className="mb-4 block text-4xl">📝</span>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              {material.name}
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              {material.description || "Este quiz está sendo preparado."}
            </p>
            <div className="rounded border border-yellow-300 bg-white p-4">
              <p className="text-sm text-yellow-700">
                ⚠️ Nenhuma questão cadastrada ainda. Este conteúdo estará
                disponível em breve.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Tela inicial do quiz
    if (!quizStarted) {
      const passingScore = material.quizData?.passingScore || 70;
      return (
        <div className="animate-fadeIn space-y-6 p-8 text-center">
          <div className="mb-4 animate-bounce text-6xl">📝</div>
          <h3 className="transform text-2xl font-bold transition-all duration-500 hover:scale-105">
            {material.name}
          </h3>
          <div className="transform rounded-lg bg-gray-50 p-6 transition-all duration-300 hover:bg-gray-100 hover:shadow-lg">
            <div className="mb-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <strong>Questões:</strong>{" "}
                {shuffledQuestions.length ||
                  material.quizData?.questions?.length ||
                  0}
              </div>
              <div>
                <strong>Nota mínima:</strong> {passingScore}%
              </div>
            </div>
            <p className="text-gray-700">
              Este quiz testará seus conhecimentos sobre os tópicos abordados.
              Você precisa de pelo menos {passingScore}% para ser aprovado.
            </p>
          </div>
          <button
            onClick={startQuiz}
            className="transform rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white transition-all duration-300 hover:scale-105 hover:bg-blue-700 hover:shadow-lg active:scale-95"
          >
            Iniciar Quiz
          </button>
        </div>
      );
    }

    // Tela de resultados - DEVE VIR ANTES da revisão
    if (showResults) {
      const correctAnswers = answers.filter(
        (answer, index) => answer === shuffledQuestions[index].correctAnswer,
      ).length;
      const wrongAnswers = shuffledQuestions.length - correctAnswers;
      const score = (correctAnswers / shuffledQuestions.length) * 100;
      const errorRate = (wrongAnswers / shuffledQuestions.length) * 100;
      const passed = score >= (material.quizData?.passingScore || 70);

      return (
        <div className="animate-fadeIn space-y-6 p-8">
          <div
            className={`rounded-lg p-6 ${passed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"} transform border-2 transition-all duration-500 hover:shadow-lg`}
          >
            <div className="text-center">
              <span className="animate-bounce text-4xl">
                {passed ? "🎉" : "😞"}
              </span>
              <h3 className="mt-2 transform text-xl font-semibold transition-all duration-300">
                {passed ? "Parabéns!" : "Tente novamente"}
              </h3>

              {/* Estatísticas detalhadas */}
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="animate-slideInUp transform rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md">
                  <div className="text-2xl font-bold text-green-600">
                    {correctAnswers}
                  </div>
                  <div className="text-sm text-gray-600">Acertos</div>
                  <div
                    className={`mt-1 rounded px-2 py-1 text-xs font-medium transition-colors duration-200 ${
                      score >= 70
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {Math.round(score)}%
                  </div>
                </div>

                <div
                  className="animate-slideInUp transform rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md"
                  style={{ animationDelay: "0.1s" }}
                >
                  <div className="text-2xl font-bold text-red-600">
                    {wrongAnswers}
                  </div>
                  <div className="text-sm text-gray-600">Erros</div>
                  <div
                    className={`mt-1 rounded px-2 py-1 text-xs font-medium transition-colors duration-200 ${
                      errorRate > 0
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {Math.round(errorRate)}%
                  </div>
                </div>

                <div
                  className="animate-slideInUp transform rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md"
                  style={{ animationDelay: "0.2s" }}
                >
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.floor(timeSpent / 60)}:
                    {(timeSpent % 60).toString().padStart(2, "0")}
                  </div>
                  <div className="text-sm text-gray-600">Tempo Gasto</div>
                  <div className="mt-1 rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 transition-colors duration-200">
                    Total
                  </div>
                </div>

                <div
                  className="animate-slideInUp transform rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md"
                  style={{ animationDelay: "0.3s" }}
                >
                  <div className="text-2xl font-bold text-purple-600">
                    {(() => {
                      const currentProgress = getUserProgress(userId, trailId);
                      const moduleProgress =
                        currentProgress?.modulesProgress?.find(
                          (m) => m.moduleId === moduleId,
                        );
                      const materialProgress =
                        moduleProgress?.materialsProgress?.find(
                          (m) => m.materialId === material.id,
                        );
                      return (materialProgress?.attempts || 0) + 1;
                    })()}
                  </div>
                  <div className="text-sm text-gray-600">Tentativas</div>
                  <div className="mt-1 rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 transition-colors duration-200">
                    Atual
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p
                  className={`text-lg font-semibold ${passed ? "text-green-600" : "text-red-600"}`}
                >
                  Resultado Final: {Math.round(score)}%
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {passed
                    ? "Aprovado! Você atingiu a nota mínima."
                    : `Reprovado. Nota mínima: ${material.quizData?.passingScore || 70}%`}
                </p>
              </div>
            </div>
          </div>

          <div
            className="animate-slideInUp flex justify-center space-x-4"
            style={{ animationDelay: "0.4s" }}
          >
            <button
              onClick={resetQuiz}
              className="transform rounded-lg bg-gray-600 px-6 py-2 text-white transition-all duration-300 hover:scale-105 hover:bg-gray-700 active:scale-95"
            >
              Tentar Novamente
            </button>
            {passed && (
              <button
                onClick={() => {
                  console.log("✅ Quiz concluído com aprovação! Score:", score);

                  // Salvar conclusão
                  handleCompletion(score);

                  // Forçar salvamento do progresso
                  updateMaterialProgress(
                    userId,
                    trailId,
                    moduleId,
                    material.id,
                    {
                      materialId: material.id,
                      completed: true,
                      progress: 100,
                      timeSpent,
                      score: Math.round(score),
                      lastAccessed: new Date(),
                    },
                  );

                  // Redirecionar para página de certificado
                  // A validação de 100% de conclusão será feita no backend
                  setTimeout(() => {
                    console.log(
                      "🎓 Redirecionando para página de certificado...",
                    );
                    window.location.href = `/certificate/${trailId}`;
                  }, 500);
                }}
                className="transform rounded-lg bg-green-600 px-6 py-2 text-white transition-all duration-300 hover:scale-105 hover:bg-green-700 active:scale-95"
              >
                Concluir
              </button>
            )}
          </div>

          {/* Revisão das respostas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Revisão das Respostas:</h4>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="mr-2 h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-green-700">
                    {correctAnswers} Corretas
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="mr-2 h-3 w-3 rounded-full bg-red-500"></div>
                  <span className="text-red-700">
                    {wrongAnswers} Incorretas
                  </span>
                </div>
              </div>
            </div>

            {shuffledQuestions.map((question, index) => {
              const userAnswer = answers[index];
              const isCorrect = userAnswer === question.correctAnswer;

              return (
                <div
                  key={question.id}
                  className={`rounded border p-4 ${isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <p className="flex-1 font-medium">
                      {index + 1}. {question.question}
                    </p>
                    <div
                      className={`ml-3 flex items-center rounded px-2 py-1 text-xs font-medium ${
                        isCorrect
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {isCorrect ? "✓ Correto" : "✗ Erro"}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p
                      className={`${isCorrect ? "text-green-700" : "text-red-700"}`}
                    >
                      <span className="font-medium">Sua resposta:</span>{" "}
                      {question.options && question.options.length > userAnswer
                        ? question.options[userAnswer]
                        : "Não respondida"}
                    </p>
                    {!isCorrect && (
                      <p className="text-green-700">
                        <span className="font-medium">Resposta correta:</span>{" "}
                        {question.options &&
                        question.options.length > (question.correctAnswer ?? 0)
                          ? question.options[question.correctAnswer ?? 0]
                          : "N/A"}
                      </p>
                    )}
                    {question.explanation && (
                      <div className="mt-2 rounded border border-blue-200 bg-blue-50 p-3">
                        <p className="text-sm text-blue-800">
                          <span className="font-medium">💡 Explicação:</span>{" "}
                          {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Tela de revisão das respostas
    if (showReview) {
      const answeredQuestions = answers.filter(
        (answer) => answer !== undefined,
      ).length;
      const totalQuestions = shuffledQuestions.length;

      const currentAttempts = (() => {
        const currentProgress = getUserProgress(userId, trailId);
        const moduleProgress = currentProgress?.modulesProgress?.find(
          (m) => m.moduleId === moduleId,
        );
        const materialProgress = moduleProgress?.materialsProgress?.find(
          (m) => m.materialId === material.id,
        );
        return (materialProgress?.attempts || 0) + 1;
      })();

      return (
        <div className="animate-fadeIn space-y-6 p-6">
          <div className="transform rounded-lg border border-blue-200 bg-blue-50 p-6 transition-all duration-300 hover:shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="transform text-xl font-bold text-blue-800 transition-all duration-300">
                📋 Revisão das Respostas
              </h3>
              <div className="transform rounded-lg bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 transition-all duration-200 hover:bg-blue-200">
                Tentativa {currentAttempts}
              </div>
            </div>
            <p className="mb-4 text-blue-700">
              Revise suas respostas antes de finalizar o quiz. Você respondeu{" "}
              <strong>
                {answeredQuestions} de {totalQuestions}
              </strong>{" "}
              questões.
            </p>
            {answeredQuestions < totalQuestions && (
              <div className="mb-4 rounded border border-yellow-300 bg-yellow-100 p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Você ainda tem{" "}
                  <strong>{totalQuestions - answeredQuestions} questões</strong>{" "}
                  sem resposta.
                </p>
              </div>
            )}
          </div>

          {/* Lista de todas as questões com respostas marcadas */}
          <div className="space-y-4">
            {shuffledQuestions.map((question, index) => {
              const userAnswer = answers[index];
              const hasAnswer = userAnswer !== undefined;

              return (
                <div
                  key={question.id}
                  className={`animate-slideInUp transform rounded-lg border-2 p-4 transition-all duration-300 hover:shadow-md ${
                    hasAnswer
                      ? "border-blue-200 bg-blue-50 hover:bg-blue-100"
                      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center">
                      <div
                        className={`mr-3 flex h-8 w-8 transform items-center justify-center rounded-full text-sm font-bold text-white transition-all duration-200 ${
                          hasAnswer ? "bg-blue-500" : "bg-gray-400"
                        }`}
                      >
                        {hasAnswer ? index + 1 : "?"}
                      </div>
                      <h4 className="font-medium text-gray-900 transition-colors duration-200">
                        {index + 1}. {question.question}
                      </h4>
                    </div>
                    <button
                      onClick={() => {
                        setShowReview(false);
                        setCurrentQuestionIndex(index);
                      }}
                      className="ml-4 flex-shrink-0 transform rounded-lg border border-blue-300 px-3 py-1 text-sm text-blue-600 transition-all duration-200 hover:scale-105 hover:bg-blue-50 hover:text-blue-800 active:scale-95"
                    >
                      ✏️ Editar
                    </button>
                  </div>

                  <div className="space-y-2">
                    {question.options &&
                      question.options.length > 0 &&
                      question.options.map(
                        (option: string, optionIndex: number) => {
                          const isUserAnswer = userAnswer === optionIndex;

                          return (
                            <div
                              key={optionIndex}
                              className={`transform rounded-lg border p-3 text-sm transition-all duration-200 hover:scale-102 ${
                                isUserAnswer
                                  ? "border-blue-300 bg-blue-100 font-medium text-blue-800 hover:bg-blue-200"
                                  : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="mr-3 font-bold transition-colors duration-200">
                                    {String.fromCharCode(65 + optionIndex)}.
                                  </span>
                                  <span className="transition-colors duration-200">
                                    {option}
                                  </span>
                                </div>
                                {isUserAnswer && (
                                  <span className="animate-pulse font-medium text-blue-600">
                                    ← Sua escolha
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        },
                      )}

                    {!hasAnswer && (
                      <div className="text-sm font-medium text-red-600">
                        ❌ Nenhuma resposta selecionada
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botões de ação */}
          <div
            className="animate-slideInUp flex justify-between"
            style={{ animationDelay: "0.3s" }}
          >
            <button
              onClick={backToQuiz}
              className="transform rounded-lg border border-gray-300 px-6 py-2 text-gray-600 transition-all duration-300 hover:scale-105 hover:bg-gray-50 active:scale-95"
            >
              ← Voltar às Questões
            </button>

            <button
              onClick={confirmSubmission}
              disabled={answeredQuestions < totalQuestions}
              className="transform rounded-lg bg-green-600 px-6 py-2 text-white transition-all duration-300 hover:scale-105 hover:bg-green-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {answeredQuestions < totalQuestions
                ? "Complete todas as questões"
                : "✓ Finalizar Quiz"}
            </button>
          </div>
        </div>
      );
    }

    if (shuffledQuestions.length === 0) {
      return <div className="p-8 text-center">Carregando quiz...</div>;
    }

    // Questão atual
    const currentQuestion = shuffledQuestions[currentQuestionIndex];

    return (
      <div className="animate-fadeIn space-y-6 p-6">
        {/* Progresso do quiz */}
        <div className="animate-slideInDown flex items-center justify-between">
          <span className="text-sm text-gray-600 transition-all duration-300">
            Questão {currentQuestionIndex + 1} de {shuffledQuestions.length}
          </span>
          <span className="text-sm text-gray-600 transition-all duration-300">
            Tempo: {Math.floor(timeSpent / 60)}:
            {(timeSpent % 60).toString().padStart(2, "0")}
          </span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-blue-600 transition-all duration-500 ease-out"
            style={{
              width: `${((currentQuestionIndex + 1) / shuffledQuestions.length) * 100}%`,
            }}
          />
        </div>

        {/* Questão atual */}
        <div className="animate-slideInUp transform rounded-lg border bg-white p-6 shadow transition-all duration-300 hover:shadow-lg">
          <h3 className="mb-4 text-lg font-medium transition-colors duration-300">
            {currentQuestion.question}
          </h3>

          <div className="space-y-3">
            {currentQuestion.options &&
              currentQuestion.options.length > 0 &&
              currentQuestion.options.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  className={`w-full transform rounded border-2 p-4 text-left transition-all duration-300 hover:scale-102 active:scale-98 ${
                    answers[currentQuestionIndex] === index
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="mr-3 font-medium">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </button>
              ))}
          </div>

          <div
            className="animate-slideInUp mt-6 flex justify-between"
            style={{ animationDelay: "0.2s" }}
          >
            <button
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
              className="transform rounded border border-gray-300 px-4 py-2 text-gray-600 transition-all duration-300 hover:scale-105 hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              ← Anterior
            </button>

            <button
              onClick={nextQuestion}
              disabled={answers[currentQuestionIndex] === undefined}
              className="transform rounded bg-blue-600 px-4 py-2 text-white transition-all duration-300 hover:scale-105 hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {currentQuestionIndex === shuffledQuestions.length - 1
                ? "Revisar Respostas"
                : "Próxima →"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleCompletion = async (score?: number) => {
    console.log("🎯 handleCompletion chamado! Score:", score);
    setIsCompleted(true);
    setCurrentProgress(100);

    updateMaterialProgress(userId, trailId, moduleId, material.id, {
      materialId: material.id,
      completed: true,
      progress: 100,
      timeSpent,
      score,
      lastAccessed: new Date(),
    });

    // Salvar progresso no backend
    console.log("💾 Iniciando salvamento no backend...");
    console.log("🔍 Material completo:", material);
    console.log("🔍 Material type:", material.type);
    try {
      const token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("access_token");

      // CORREÇÃO: usar APENAS id_atividade (não fallback para material.id)
      const atividadeId = material.id_atividade;

      console.log("🔑 Token:", token ? "encontrado" : "NÃO ENCONTRADO");
      console.log(
        "📝 material.id_atividade:",
        material.id_atividade,
        "(tipo:",
        typeof material.id_atividade,
        ")",
      );
      console.log(
        "📝 material.id:",
        material.id,
        "(tipo:",
        typeof material.id,
        ")",
      );
      console.log("📝 material.quizId:", material.quizId);
      console.log("📝 AtividadeId final:", atividadeId);

      if (!atividadeId) {
        console.warn(
          "⚠️ Material não possui id_atividade! Isso é normal para materiais que ainda não foram sincronizados com o backend.",
        );
        console.warn(
          "⚠️ Para salvar progresso, o material precisa ter um id_atividade válido do backend.",
        );
        return; // Não tentar salvar se não tiver id_atividade
      }

      if (token && atividadeId) {
        console.log(
          "📡 Enviando POST para /api/progresso/salvar/ com id_atividade:",
          atividadeId,
        );
        const response = await fetch(
          "http://localhost:8000/api/progresso/salvar/",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id_atividade: atividadeId,
            }),
          },
        );

        console.log("📨 Resposta recebida - Status:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log(
            "✅ Progresso salvo no backend - Atividade:",
            atividadeId,
            "Resposta:",
            data,
          );
        } else {
          const errorText = await response.text();
          console.warn(
            "⚠️ Falha ao salvar progresso - Status:",
            response.status,
            "Erro:",
            errorText,
          );
          console.warn("⚠️ Payload enviado:", { id_atividade: atividadeId });
        }
      } else {
        console.error("❌ Token ausente! Token:", !!token);
      }
    } catch (error) {
      console.error("❌ Erro ao salvar progresso no backend:", error);
    }

    console.log("✅ handleCompletion finalizado, chamando onComplete()");
    onComplete(score);
  };

  const renderMaterial = () => {
    switch (material.type) {
      case "video":
        return renderVideoPlayer();
      case "pdf":
        return renderPDFViewer();
      case "reading":
        return renderReadingMaterial();
      case "quiz":
        return renderQuiz();
      case "exercise":
        return renderExercise();
      case "presentation":
        return renderPresentation();
      case "text":
        // Renderizar conteúdo de texto/placeholder (módulos em desenvolvimento)
        return (
          <div className="p-6">
            <div className="mx-auto max-w-3xl rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 shadow-sm">
              <div className="mb-6 text-center">
                <span className="mb-4 block text-6xl">📄</span>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  {material.name}
                </h2>
                {material.description && (
                  <p className="text-sm text-gray-600">
                    {material.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-6">
            <div className="mx-auto max-w-md rounded-lg border-2 border-red-200 bg-red-50 p-6 text-center">
              <span className="mb-4 block text-4xl">❌</span>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Tipo não suportado
              </h3>
              <p className="text-sm text-gray-600">
                Tipo de material:{" "}
                <code className="rounded bg-gray-100 px-2 py-1">
                  {material.type}
                </code>
              </p>
            </div>
          </div>
        );
    }
  };

  const renderExercise = () => {
    const handleMarkAsComplete = () => {
      setCurrentProgress(100);
      handleCompletion();
    };

    return (
      <div className="space-y-4">
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start gap-3">
            <span className="text-3xl">✏️</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {material.name}
              </h3>
              <p className="mt-2 text-gray-700">{material.description}</p>
            </div>
          </div>
        </div>

        <div className="py-8 text-center text-gray-600">
          <p>Conteúdo não disponível</p>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">
            ℹ️ Complete este exercício conforme as instruções acima e marque
            como concluído.
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={handleMarkAsComplete}
            className="transform rounded-lg bg-green-600 px-6 py-2 text-white transition-all duration-300 hover:scale-105 hover:bg-green-700 active:scale-95"
          >
            ✓ Marcar como Concluído
          </button>
        </div>
      </div>
    );
  };

  const renderPresentation = () => {
    const handleMarkAsViewed = () => {
      setCurrentProgress(100);
      handleCompletion();
    };

    return (
      <div className="space-y-4">
        <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6">
          <div className="flex items-start gap-3">
            <span className="text-3xl">📊</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {material.name}
              </h3>
              <p className="mt-2 text-gray-700">{material.description}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="space-y-4 text-center">
            {material.url && (
              <>
                <p className="text-gray-600">
                  Clique no botão abaixo para visualizar a apresentação
                </p>
                <a
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex transform items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 text-white transition-all duration-300 hover:scale-105 hover:bg-purple-700 active:scale-95"
                >
                  🔗 Abrir Apresentação
                </a>
              </>
            )}
            {!material.url && (
              <p className="text-gray-500">Nenhuma apresentação anexada</p>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={handleMarkAsViewed}
            className="transform rounded-lg bg-green-600 px-6 py-2 text-white transition-all duration-300 hover:scale-105 hover:bg-green-700 active:scale-95"
          >
            ✓ Marcar como Visualizado
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header do material */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {material.name}
          </h2>
          {material.description && (
            <p className="mt-1 text-sm text-gray-600">{material.description}</p>
          )}
        </div>

        {isCompleted && (
          <span className="flex items-center rounded-full bg-green-100 px-3 py-1 text-sm text-green-600">
            ✓ Concluído
          </span>
        )}
      </div>

      {/* Conteúdo do material */}
      <div className="overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="p-6">{renderMaterial()}</div>
      </div>
    </div>
  );
};

export default MaterialViewer;
