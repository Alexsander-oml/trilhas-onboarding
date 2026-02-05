/**
 * Tipos e interfaces para o sistema de certificação
 */

export interface Certificate {
  id?: string;
  userId: number;
  trailId: number;
  trailName: string;
  studentName: string;
  nome_aluno?: string;  // Alias para compatibilidade com backend
  startDate: string;
  data_emissao?: string;  // Alias para compatibilidade
  endDate: string;
  workload: number;
  carga_horaria?: number;  // Alias para compatibilidade
  issuedAt: string;
  status: "visual" | "issued" | "pending_sync";
  verificationCode?: string;
}

export interface CertificatePayload extends Omit<Certificate, "id" | "issuedAt"> {
  issuedAt?: string;
}

export interface CertificateResponse {
  id: string;
  userId: number;
  trailId: number;
  trailName: string;
  studentName: string;
  startDate: string;
  endDate: string;
  workload: number;
  issuedAt: string;
  verificationCode: string;
  createdAt: string;
  updatedAt: string;
}
