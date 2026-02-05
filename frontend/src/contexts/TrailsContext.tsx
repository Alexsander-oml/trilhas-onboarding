/**
 * TRILHAS CONTEXT - Gerenciamento de Estado Global das Trilhas de Aprendizagem
 * 
 * RESPONSABILIDADES:
 * - Armazenar estado de todas as trilhas da aplicação
 * - Fornecer operações CRUD (Create, Read, Update, Delete)
 * - Manter dados em memória durante a sessão
 * - Prover interface consistente para componentes
 * 
 * FUTURO (migração para React Query):
 * - Este contexto será substituído por hooks useTrails(), useCreateTrail(), etc.
 * - Os dados virão do backend via API REST
 * - Cache automático e sincronização em tempo real
 * - Otimistic updates e background refetch
 * 
 * ESTRUTURA DE DADOS:
 * - Trail: Entidade principal (trilha de aprendizagem)
 * - Module: Módulos dentro de uma trilha
 * - Material: Conteúdos individuais (vídeo, PDF, quiz, etc.)
 * - Prerequisites: Sistema de pré-requisitos entre módulos
 * - Requirements: Requisitos de conclusão de materiais
 */

import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

/**
 * Interface para controlar progresso individual de materiais
 * Usado para rastrear vídeos pausados, PDFs lidos parcialmente, etc.
 */
interface MaterialProgress {
  materialId: number;
  completed: boolean;
  score?: number;           // Pontuação obtida (para quizzes)
  timeSpent?: number;       // Tempo gasto em segundos
  lastAccessed?: Date;      // Último acesso
  progress?: number;        // Progresso em % (0-100) para vídeos, PDFs
}

/**
 * Sistema de pré-requisitos entre módulos
 * Permite criar dependências: "Módulo B só após completar Módulo A com 70% de nota"
 */
interface ModulePrerequisite {
  moduleId: number;         // ID do módulo que é pré-requisito
  requiredScore?: number;   // Nota mínima necessária (0-100)
  requiredCompletion?: boolean; // Se deve estar 100% completo
}

/**
 * Configurações de requisitos para materiais individuais
 * Define critérios de aprovação, tentativas, tempo limite
 */
interface MaterialRequirement {
  minimumScore?: number;    // Nota mínima para aprovação (quizzes)
  passingScore?: number;    // Nota de aprovação (pode ser diferente da mínima)
  timeLimit?: number;       // Tempo limite em minutos (para quizzes)
  attemptsAllowed?: number; // Número máximo de tentativas
}

/**
 * INTERFACE PRINCIPAL: TRAIL (Trilha de Aprendizagem)
 * 
 * Representa uma trilha completa de aprendizagem com todos seus módulos e materiais.
 * É a entidade central do sistema, contendo toda a estrutura curricular.
 * 
 * CAMPOS PRINCIPAIS:
 * - Metadados: id, name, description, objectives
 * - Classificação: tags, targetAudience, difficulty
 * - Gestão: status, deadline, prazo
 * - Métricas: inscricoes, taxaConclusao
 * - Estrutura: modules[] (hierarquia de conteúdo)
 * - Auditoria: createdAt, updatedAt
 */
export interface Trail {
  // === IDENTIFICAÇÃO ===
  id: number;                     // ID único da trilha
  name: string;                   // Nome da trilha (ex: "Onboarding FAURG")
  description: string;            // Descrição resumida
  objectives: string;             // Objetivos de aprendizagem detalhados
  
  // === CLASSIFICAÇÃO ===
  tags: string[];                 // Tags para categorização (ex: ["RH", "Integração"])
  targetAudience: string;         // Público-alvo (ex: "Novos colaboradores")
  
  // === GESTÃO ADMINISTRATIVA ===
  deadline: string;               // Data limite (ISO string)
  status: 'Ativo' | 'Rascunho' | 'Pausado'; // Status da trilha
  prazo: string;                  // Prazo para conclusão (ex: "15 dias")
  
  // === MÉTRICAS ===
  inscricoes: string;             // Número de inscritos (ex: "23 pessoas")
  taxaConclusao: number;          // Taxa de conclusão em % (0-100)
  
  // === ESTRUTURA CURRICULAR ===
  modules: Array<{
    // --- Identificação do Módulo ---
    id: number;                   // ID único do módulo
    name: string;                 // Nome do módulo (ex: "Módulo 1 - Boas-vindas")
    steps: number;                // Número de etapas/materiais
    
    // --- Configurações Pedagógicas ---
    prerequisites?: ModulePrerequisite[]; // Pré-requisitos para acessar
    sequentialOrder?: boolean;    // Se materiais devem ser feitos em ordem
    
    // --- Materiais do Módulo ---
    materials: Array<{
      // Identificação
      id: number;                 // ID único do material
      type: string;               // Tipo: 'video', 'pdf', 'reading', 'quiz'
      name: string;               // Nome do material
      
      // Apresentação Visual
      icon: string;               // Emoji ou ícone para UI
      color: string;              // Cor para identificação visual
      
      // Conteúdo
      url?: string;               // URL do arquivo (vídeo, PDF, etc.)
      duration?: number;          // Duração estimada em minutos
      description?: string;       // Descrição opcional
      
      // Configurações Pedagógicas
      requirements?: MaterialRequirement; // Requisitos de conclusão
      
      // Dados Específicos de Quiz
      quizData?: {
        questions: Array<{
          id: number;             // ID da pergunta
          question: string;       // Texto da pergunta
          options: string[];      // Opções de resposta
          correctAnswer: number;  // Índice da resposta correta (0-based)
          explanation?: string;   // Explicação da resposta
        }>;
        passingScore: number;     // Nota mínima para aprovação
        shuffleQuestions?: boolean; // Embaralhar perguntas
        shuffleOptions?: boolean;   // Embaralhar opções
      };
    }>;
  }>;
  
  // === AUDITORIA ===
  createdAt: Date;                // Data de criação
  updatedAt: Date;                // Data da última atualização
}

interface TrailsContextType {
  trails: Trail[];
  addTrail: (trail: Omit<Trail, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'inscricoes' | 'taxaConclusao' | 'prazo'>) => void;
  updateTrail: (id: number, trail: Partial<Trail>) => void;
  deleteTrail: (id: number) => void;
  getTrailById: (id: number) => Trail | undefined;
  updateTrailModules: (trailId: number, modules: Trail['modules']) => void;
}

const TrailsContext = createContext<TrailsContextType | undefined>(undefined);

export const useTrails = () => {
  const context = useContext(TrailsContext);
  if (!context) {
    throw new Error('useTrails must be used within a TrailsProvider');
  }
  return context;
};

interface TrailsProviderProps {
  children: ReactNode;
}

export const TrailsProvider: React.FC<TrailsProviderProps> = ({ children }) => {
  const [trails, setTrails] = useState<Trail[]>([
    // Trilhas de exemplo (dados iniciais)
    {
      id: 1,
      name: 'Onboarding FAURG',
      description: 'Trilha de integração para novos colaboradores',
      objectives: 'Apresentar a cultura, valores e processos da FAURG',
      tags: ['RH', 'Integração', 'Cultura'],
      targetAudience: 'Novos colaboradores',
      deadline: '2024-12-31',
      status: 'Ativo',
      inscricoes: '23 pessoas',
      taxaConclusao: 87,
      prazo: '15 dias',
      modules: [
        {
          id: 1,
          name: 'Módulo 1 - Boas-vindas',
          steps: 3,
          materials: [
            { id: 1, type: 'video', name: 'Apresentação da FAURG', icon: '🎥', color: '#DC2626' },
            { id: 2, type: 'pdf', name: 'Manual do Colaborador', icon: '📄', color: '#059669' },
            { 
              id: 3, 
              type: 'quiz', 
              name: 'Quiz de Integração', 
              icon: '✅', 
              color: '#7C3AED',
              requirements: {
                passingScore: 70,
                attemptsAllowed: 3
              },
              quizData: {
                questions: [
                  {
                    id: 1,
                    question: "Qual é o principal valor da FAURG?",
                    options: ["Lucro", "Inovação", "Pessoas", "Tecnologia"],
                    correctAnswer: 2,
                    explanation: "A FAURG prioriza as pessoas como seu principal valor."
                  },
                  {
                    id: 2,
                    question: "Quantos dias você tem para completar o onboarding?",
                    options: ["7 dias", "15 dias", "30 dias", "45 dias"],
                    correctAnswer: 1,
                    explanation: "O processo de onboarding deve ser completado em 15 dias."
                  }
                ],
                passingScore: 70,
                shuffleQuestions: true,
                shuffleOptions: true
              }
            }
          ]
        }
      ],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: 2,
      name: 'Compliance e Ética',
      description: 'Treinamento sobre compliance e código de ética',
      objectives: 'Garantir conhecimento sobre normas e práticas éticas',
      tags: ['Compliance', 'Ética', 'Regulamentação'],
      targetAudience: 'Todos os colaboradores',
      deadline: '2024-11-30',
      status: 'Ativo',
      inscricoes: '156 pessoas',
      taxaConclusao: 94,
      prazo: '10 dias',
      modules: [
        {
          id: 1,
          name: 'Módulo 1 - Fundamentos',
          steps: 4,
          materials: [
            { id: 1, type: 'reading', name: 'Código de Ética', icon: '📖', color: '#0891B2', description: 'Fundamentos éticos da organização' },
            { id: 2, type: 'video', name: 'Casos Práticos', icon: '🎥', color: '#DC2626', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', duration: 120 },
            { id: 3, type: 'pdf', name: 'Diretrizes de Compliance', icon: '📄', color: '#059669', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', description: 'Documento com as principais diretrizes' },
            { 
              id: 4, 
              type: 'quiz', 
              name: 'Avaliação Final', 
              icon: '✅', 
              color: '#7C3AED', 
              description: 'Teste seus conhecimentos sobre ética',
              requirements: {
                passingScore: 80,
                attemptsAllowed: 2
              },
              quizData: {
                questions: [
                  {
                    id: 1,
                    question: "O que caracteriza um comportamento ético?",
                    options: ["Fazer apenas o que é legal", "Agir com integridade e responsabilidade", "Seguir apenas as regras da empresa", "Priorizar sempre o lucro"],
                    correctAnswer: 1,
                    explanation: "Comportamento ético envolve agir com integridade, responsabilidade e consideração pelos outros."
                  },
                  {
                    id: 2,
                    question: "Em caso de conflito de interesse, você deve:",
                    options: ["Ignorar a situação", "Informar imediatamente ao supervisor", "Resolver sozinho", "Pedir opinião aos colegas"],
                    correctAnswer: 1,
                    explanation: "Conflitos de interesse devem ser sempre reportados ao supervisor imediatamente."
                  },
                  {
                    id: 3,
                    question: "Qual a importância do código de ética?",
                    options: ["É apenas um documento formal", "Orienta as decisões e comportamentos", "Serve só para auditoria", "É opcional seguir"],
                    correctAnswer: 1,
                    explanation: "O código de ética é fundamental para orientar decisões e comportamentos no ambiente corporativo."
                  }
                ],
                passingScore: 80,
                shuffleQuestions: true,
                shuffleOptions: false
              }
            }
          ]
        }
      ],
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-05')
    },
    {
      id: 3,
      name: 'Segurança da Informação',
      description: 'Boas práticas de segurança digital',
      objectives: 'Capacitar sobre proteção de dados e segurança digital',
      tags: ['Segurança', 'TI', 'LGPD'],
      targetAudience: 'Todos os colaboradores',
      deadline: '2024-10-31',
      status: 'Rascunho',
      inscricoes: '0 pessoas',
      taxaConclusao: 0,
      prazo: '7 dias',
      modules: [],
      createdAt: new Date('2024-03-10'),
      updatedAt: new Date('2024-03-10')
    },
    {
      id: 4,
      name: 'Desenvolvimento de Liderança',
      description: 'Programa de capacitação para líderes e gestores',
      objectives: 'Desenvolver competências de liderança, comunicação e gestão de equipes',
      tags: ['Liderança', 'Gestão', 'Desenvolvimento'],
      targetAudience: 'Gestores',
      deadline: '2025-03-15',
      status: 'Ativo',
      inscricoes: '42 pessoas',
      taxaConclusao: 73,
      prazo: '20 dias',
      modules: [
        {
          id: 1,
          name: 'Módulo 1 - Fundamentos da Liderança',
          steps: 5,
          materials: [
            { id: 1, type: 'video', name: 'Estilos de Liderança', icon: '🎥', color: '#DC2626', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', duration: 180 },
            { id: 2, type: 'pdf', name: 'Manual do Líder', icon: '📄', color: '#059669', url: 'https://www.africau.edu/images/default/sample.pdf', description: 'Guia completo de liderança' },
            { id: 3, type: 'reading', name: 'Teoria da Liderança', icon: '📖', color: '#0891B2' },
            { id: 4, type: 'quiz', name: 'Autoavaliação de Liderança', icon: '✅', color: '#7C3AED' },
            { id: 5, type: 'video', name: 'Cases de Sucesso', icon: '🎥', color: '#DC2626' }
          ]
        },
        {
          id: 2,
          name: 'Módulo 2 - Comunicação Eficaz',
          steps: 3,
          materials: [
            { id: 1, type: 'video', name: 'Técnicas de Comunicação', icon: '🎥', color: '#DC2626' },
            { id: 2, type: 'pdf', name: 'Feedback Construtivo', icon: '📄', color: '#059669' },
            { id: 3, type: 'quiz', name: 'Avaliação de Comunicação', icon: '✅', color: '#7C3AED' }
          ]
        }
      ],
      createdAt: new Date('2024-02-20'),
      updatedAt: new Date('2024-02-25')
    },
    {
      id: 5,
      name: 'Transformação Digital',
      description: 'Entenda os conceitos e ferramentas da era digital',
      objectives: 'Capacitar colaboradores sobre tecnologias emergentes e mudanças digitais no mercado',
      tags: ['Tecnologia', 'Digital', 'Inovação'],
      targetAudience: 'Todos os colaboradores',
      deadline: '2025-06-30',
      status: 'Ativo',
      inscricoes: '128 pessoas',
      taxaConclusao: 65,
      prazo: '15 dias',
      modules: [
        {
          id: 1,
          name: 'Módulo 1 - Introdução à Era Digital',
          steps: 4,
          materials: [
            { id: 1, type: 'video', name: 'O Futuro do Trabalho', icon: '🎥', color: '#DC2626', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', duration: 300 },
            { id: 2, type: 'reading', name: 'Conceitos Fundamentais', icon: '📖', color: '#0891B2', description: 'Principais conceitos da transformação digital' },
            { id: 3, type: 'pdf', name: 'Ferramentas Digitais', icon: '📄', color: '#059669', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', description: 'Guia de ferramentas essenciais' },
            { id: 4, type: 'quiz', name: 'Avaliação Digital', icon: '✅', color: '#7C3AED', description: 'Teste seus conhecimentos digitais' }
          ]
        }
      ],
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-15')
    },
    {
      id: 6,
      name: 'Gestão de Projetos Ágeis',
      description: 'Metodologias ágeis para gestão eficiente de projetos',
      objectives: 'Implementar práticas ágeis para otimizar a execução de projetos e entregas',
      tags: ['Agile', 'Scrum', 'Projetos'],
      targetAudience: 'Gestores de projeto e equipes técnicas',
      deadline: '2025-08-15',
      status: 'Ativo',
      inscricoes: '89 pessoas',
      taxaConclusao: 78,
      prazo: '12 dias',
      modules: [
        {
          id: 1,
          name: 'Módulo 1 - Fundamentos Ágeis',
          steps: 5,
          materials: [
            { id: 1, type: 'reading', name: 'Manifesto Ágil', icon: '📖', color: '#0891B2', description: 'Os valores e princípios do desenvolvimento ágil' },
            { id: 2, type: 'video', name: 'Scrum na Prática', icon: '🎥', color: '#DC2626', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', duration: 240 },
            { id: 3, type: 'pdf', name: 'Ferramentas de Gestão', icon: '📄', color: '#059669', url: 'https://www.africau.edu/images/default/sample.pdf', description: 'Principais ferramentas para projetos ágeis' },
            { id: 4, type: 'video', name: 'Daily Meetings', icon: '🎥', color: '#DC2626', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', duration: 180 },
            { id: 5, type: 'quiz', name: 'Certificação Ágil', icon: '✅', color: '#7C3AED', description: 'Avalie seu conhecimento em metodologias ágeis' }
          ]
        }
      ],
      createdAt: new Date('2024-03-10'),
      updatedAt: new Date('2024-03-20')
    },
    {
      id: 7,
      name: 'Diversidade e Inclusão',
      description: 'Construindo um ambiente de trabalho mais inclusivo e diverso',
      objectives: 'Promover práticas inclusivas e conscientização sobre diversidade no ambiente corporativo',
      tags: ['Diversidade', 'Inclusão', 'RH'],
      targetAudience: 'Todos os colaboradores',
      deadline: '2025-12-31',
      status: 'Ativo',
      inscricoes: '256 pessoas',
      taxaConclusao: 82,
      prazo: '10 dias',
      modules: [
        {
          id: 1,
          name: 'Módulo 1 - Fundamentos da Diversidade',
          steps: 4,
          materials: [
            { id: 1, type: 'video', name: 'Por que Diversidade Importa', icon: '🎥', color: '#DC2626', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', duration: 200 },
            { id: 2, type: 'reading', name: 'Tipos de Diversidade', icon: '📖', color: '#0891B2', description: 'Entenda as diferentes dimensões da diversidade' },
            { id: 3, type: 'pdf', name: 'Políticas de Inclusão', icon: '📄', color: '#059669', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', description: 'Diretrizes para um ambiente inclusivo' },
            { id: 4, type: 'quiz', name: 'Avaliação de Consciência', icon: '✅', color: '#7C3AED', description: 'Teste sua consciência sobre diversidade' }
          ]
        },
        {
          id: 2,
          name: 'Módulo 2 - Práticas Inclusivas',
          steps: 3,
          materials: [
            { id: 1, type: 'video', name: 'Comunicação Inclusiva', icon: '🎥', color: '#DC2626', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', duration: 150 },
            { id: 2, type: 'reading', name: 'Casos de Sucesso', icon: '📖', color: '#0891B2', description: 'Exemplos práticos de inclusão' },
            { id: 3, type: 'quiz', name: 'Certificação D&I', icon: '✅', color: '#7C3AED', description: 'Certificado em Diversidade e Inclusão' }
          ]
        }
      ],
      createdAt: new Date('2024-04-01'),
      updatedAt: new Date('2024-04-10')
    },
    {
      id: 8,
      name: 'Sustentabilidade Corporativa',
      description: 'Práticas sustentáveis para negócios responsáveis',
      objectives: 'Desenvolver consciência ambiental e implementar práticas sustentáveis no trabalho',
      tags: ['Sustentabilidade', 'ESG', 'Meio Ambiente'],
      targetAudience: 'Todos os colaboradores',
      deadline: '2025-09-30',
      status: 'Ativo',
      inscricoes: '174 pessoas',
      taxaConclusao: 71,
      prazo: '14 dias',
      modules: [
        {
          id: 1,
          name: 'Módulo 1 - ESG na Prática',
          steps: 5,
          materials: [
            { id: 1, type: 'reading', name: 'Conceitos de ESG', icon: '📖', color: '#0891B2', description: 'Environmental, Social and Governance explicados' },
            { id: 2, type: 'video', name: 'Mudanças Climáticas', icon: '🎥', color: '#DC2626', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', duration: 280 },
            { id: 3, type: 'pdf', name: 'Relatório de Sustentabilidade', icon: '📄', color: '#059669', url: 'https://www.africau.edu/images/default/sample.pdf', description: 'Como elaborar relatórios ESG' },
            { id: 4, type: 'video', name: 'Economia Circular', icon: '🎥', color: '#DC2626', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4', duration: 220 },
            { id: 5, type: 'quiz', name: 'Certificação ESG', icon: '✅', color: '#7C3AED', description: 'Avaliação em práticas sustentáveis' }
          ]
        }
      ],
      createdAt: new Date('2024-04-15'),
      updatedAt: new Date('2024-04-25')
    }
  ]);

  const addTrail = (trailData: Omit<Trail, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'inscricoes' | 'taxaConclusao' | 'prazo'>) => {
    const newTrail: Trail = {
      ...trailData,
      id: Math.max(...trails.map(t => t.id), 0) + 1,
      status: 'Ativo',
      inscricoes: '0 pessoas',
      taxaConclusao: 0,
      prazo: trailData.deadline ? `${Math.ceil((new Date(trailData.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias` : 'Sem prazo',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setTrails(prev => [...prev, newTrail]);
  };

  const updateTrail = (id: number, updatedData: Partial<Trail>) => {
    setTrails(prev => 
      prev.map(trail => 
        trail.id === id 
          ? { ...trail, ...updatedData, updatedAt: new Date() }
          : trail
      )
    );
  };

  const deleteTrail = (id: number) => {
    setTrails(prev => prev.filter(trail => trail.id !== id));
  };

  const getTrailById = (id: number): Trail | undefined => {
    return trails.find(trail => trail.id === id);
  };

  const updateTrailModules = (trailId: number, modules: Trail['modules']) => {
    setTrails(prev => 
      prev.map(trail => 
        trail.id === trailId 
          ? { ...trail, modules, updatedAt: new Date() }
          : trail
      )
    );
  };

  return (
    <TrailsContext.Provider value={{
      trails,
      addTrail,
      updateTrail,
      deleteTrail,
      getTrailById,
      updateTrailModules
    }}>
      {children}
    </TrailsContext.Provider>
  );
};