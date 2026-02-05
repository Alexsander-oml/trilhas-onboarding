/**
 * Service para gerenciar status de matrícula e controle de visualização
 */

export interface EnrollmentStatus {
  id_matricula: number;
  id_trilha: number;
  titulo_trilha: string;
  status: 'EmAndamento' | 'Concluida' | 'Cancelada';
  modo_visualizacao: boolean;
  permite_refazer: boolean;
  pode_interagir: boolean;
  progresso_percentual: number;
  data_inicio: string | null;
  data_fim: string | null;
  perfil_usuario: string;
  is_admin: boolean;
}

export interface RefazerTrilhaResponse {
  message: string;
  id_matricula: number;
  status: string;
  modo_visualizacao: boolean;
  progresso_percentual: number;
  observacao: string;
}

export interface ResetarProgressoResponse {
  message: string;
  id_matricula: number;
  status: string;
  progressos_apagados: number;
  observacao: string;
}

class EnrollmentService {
  private baseURL = 'http://localhost:8000/api';

  private getAuthToken(): string | null {
    return localStorage.getItem('authToken') || localStorage.getItem('access_token');
  }

  private getHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Obtém o status da matrícula do usuário na trilha
   * GET /api/matriculas/{id_trilha}/status/
   */
  async getEnrollmentStatus(trailId: number): Promise<EnrollmentStatus> {
    const response = await fetch(
      `${this.baseURL}/matriculas/${trailId}/status/`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar status da matrícula');
    }

    return response.json();
  }

  /**
   * Permite que admin refaça a trilha mantendo o histórico
   * POST /api/matriculas/{id_trilha}/refazer/
   */
  async refazerTrilha(trailId: number): Promise<RefazerTrilhaResponse> {
    const response = await fetch(
      `${this.baseURL}/matriculas/${trailId}/refazer/`,
      {
        method: 'POST',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao refazer trilha');
    }

    return response.json();
  }

  /**
   * Permite que admin resete completamente o progresso da trilha
   * POST /api/matriculas/{id_trilha}/resetar/
   * ATENÇÃO: Esta ação apaga todo o histórico!
   */
  async resetarProgresso(trailId: number): Promise<ResetarProgressoResponse> {
    const response = await fetch(
      `${this.baseURL}/matriculas/${trailId}/resetar/`,
      {
        method: 'POST',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao resetar progresso');
    }

    return response.json();
  }
}

export const enrollmentService = new EnrollmentService();
