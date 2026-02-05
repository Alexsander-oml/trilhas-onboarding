// ===== TIPOS BASE =====
export interface BaseModel {
  id: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// ===== USUÁRIO =====
export interface User extends BaseModel {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isStaff: boolean;
  dateJoined: string;
  profile?: UserProfile;
}

export interface UserProfile extends BaseModel {
  user: number; // User ID
  avatar?: string;
  phone?: string;
  department?: string;
  position?: string;
  bio?: string;
}

// ===== AUTENTICAÇÃO =====
export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// ===== TRILHAS =====
export interface Trail extends BaseModel {
  name: string;
  description: string;
  objectives: string;
  tags: Tag[] | any[];
  rawTags?: any;
  targetAudience: string;
  deadline: string; // ISO date string
  status: string; // 'Ativo' | 'Rascunho' | 'Inativo' | 'Publicada' | etc
  changelog?: any; // raw changelog for fallbacks
  estimatedDuration?: number; // em horas
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  thumbnail?: string;
  isPublic?: boolean;
  modules?: Module[];
  modulesCount?: number; // Contagem de módulos (fonte única de verdade vinda do backend)
  moduleCount?: number;  // Alias legado para compatibilidade
  total_modulos?: number; // Alias mantido para compatibilidade com backend atual
  enrollments?: TrailEnrollment[];
  completionRate?: number;
  totalEnrollments?: number;
  createdBy?: number; // User ID
  updatedBy?: number; // User ID
  // Campos extras usados pelo AdminDashboard
  inscricoes?: string;
  taxaConclusao?: number;
  prazo?: string;
  department?: string;
  areas?: any[];
  cargos?: any[];
  unidades?: any[];
  competencias?: any[];
}

export interface Tag extends BaseModel {
  name: string;
  color?: string;
  description?: string;
}

// ===== MÓDULOS =====
export interface Module extends BaseModel {
  trail: number; // Trail ID
  name: string;
  description?: string;
  order: number;
  isRequired: boolean;
  prerequisites: ModulePrerequisite[];
  materials: Material[];
  estimatedDuration?: number; // em minutos
}

export interface ModulePrerequisite extends BaseModel {
  module: number; // Module ID
  prerequisiteModule: number; // Module ID
  requiredScore?: number;
  isRequired: boolean;
}

// ===== MATERIAIS =====
export interface Material extends BaseModel {
  module: number; // Module ID
  name: string;
  description?: string;
  type: 'video' | 'pdf' | 'reading' | 'quiz' | 'interactive' | 'external_link';
  order: number;
  isRequired: boolean;
  content?: string; // Para reading materials
  url?: string; // Para videos, PDFs, links externos
  duration?: number; // em minutos
  fileSize?: number; // em bytes
  thumbnail?: string;
  requirements: MaterialRequirement;
}

export interface MaterialRequirement extends BaseModel {
  material: number; // Material ID
  minimumScore?: number;
  passingScore?: number;
  timeLimit?: number; // em minutos
  attemptsAllowed?: number;
  isTimedExecution?: boolean;
}

// ===== QUIZ =====
export interface Quiz extends BaseModel {
  material: number; // Material ID
  title: string;
  description?: string;
  passingScore: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  timeLimit?: number; // em minutos
  attemptsAllowed?: number;
  questions: QuizQuestion[];
}

export interface QuizQuestion extends BaseModel {
  quiz: number; // Quiz ID
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  order: number;
  points: number;
  explanation?: string;
  options?: QuizOption[];
}

export interface QuizOption extends BaseModel {
  question: number; // QuizQuestion ID
  text: string;
  isCorrect: boolean;
  order: number;
  explanation?: string;
}

// ===== PROGRESSO E MATRÍCULAS =====
export interface TrailEnrollment extends BaseModel {
  user: number; // User ID
  trail: number; // Trail ID
  enrolledAt: string; // ISO date string
  completedAt?: string; // ISO date string
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
  progressPercentage: number;
  lastAccessedAt?: string; // ISO date string
}

export interface ModuleProgress extends BaseModel {
  enrollment: number; // TrailEnrollment ID
  module: number; // Module ID
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt?: string; // ISO date string
  completedAt?: string; // ISO date string
  progressPercentage: number;
  timeSpent: number; // em segundos
}

export interface MaterialProgress extends BaseModel {
  moduleProgress: number; // ModuleProgress ID
  material: number; // Material ID
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt?: string; // ISO date string
  completedAt?: string; // ISO date string
  progressPercentage: number;
  timeSpent: number; // em segundos
  score?: number;
  attempts: number;
  lastPosition?: number; // Para vídeos, posição em segundos
}

export interface QuizAttempt extends BaseModel {
  materialProgress: number; // MaterialProgress ID
  quiz: number; // Quiz ID
  startedAt: string; // ISO date string
  completedAt?: string; // ISO date string
  score: number;
  answers: QuizAnswer[];
  timeSpent: number; // em segundos
  isCompleted: boolean;
}

export interface QuizAnswer extends BaseModel {
  attempt: number; // QuizAttempt ID
  question: number; // QuizQuestion ID
  selectedOption?: number; // QuizOption ID (para multiple choice)
  textAnswer?: string; // Para short answer
  isCorrect: boolean;
  timeSpent: number; // em segundos
}

// ===== TIPOS AUXILIARES =====
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: Record<string, any>;
}

export interface UploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

// ===== FILTROS E CONSULTAS =====
export interface TrailFilters {
  search?: string;
  tags?: number[];
  status?: Trail['status'];
  difficulty?: Trail['difficulty'];
  createdBy?: number;
  isPublic?: boolean;
  page?: number;
  pageSize?: number;
  ordering?: string;
}

export interface UserProgressSummary {
  totalTrails: number;
  enrolledTrails: number;
  completedTrails: number;
  inProgressTrails: number;
  totalTimeSpent: number; // em segundos
  averageScore: number;
  lastActivity?: string; // ISO date string
}

// ===== ESTATÍSTICAS (para admin dashboard) =====
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTrails: number;
  publishedTrails: number;
  totalEnrollments: number;
  completedEnrollments: number;
  averageCompletionRate: number;
  totalContentHours: number;
  popularTrails: Array<{
    id: number;
    name: string;
    enrollments: number;
    completionRate: number;
  }>;
  recentActivity: Array<{
    id: number;
    user: string;
    action: string;
    trail: string;
    timestamp: string;
  }>;
}