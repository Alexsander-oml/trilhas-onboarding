/**
 * Service de Certificados
 * 
 * Gerencia a criação, recuperação e sincronização de certificados.
 * Atualmente funciona com localStorage, mas já contém integrações REST comentadas
 * prontas para Django REST Framework.
 */

import type { Certificate } from "../types/certificate";

const STORAGE_KEY = "certificates";

class CertificateService {
  /**
   * Gera um novo certificado ao completar uma trilha
   * Salva localmente com status 'visual' e retorna o certificado
   */
  async issueCertificate(
    userId: number,
    trailId: number,
    trailName: string,
    studentName: string,
    startDate: string,
    endDate: string,
    workload: number
  ): Promise<Certificate> {
    const certificate: Certificate = {
      userId,
      trailId,
      trailName,
      studentName,
      startDate,
      endDate,
      workload,
      issuedAt: new Date().toISOString(),
      status: "visual",
    };

    // Gerar ID único para o certificado local
    certificate.id = this.generateCertificateId();

    // Salvar no localStorage
    this.saveCertificateLocally(certificate);

    // TODO: INTEGRAÇÃO COM BACKEND (comentada)
    // Descomente quando backend estiver pronto
    /*
    try {
      const payload: CertificatePayload = {
        userId: certificate.userId,
        trailId: certificate.trailId,
        trailName: certificate.trailName,
        studentName: certificate.studentName,
        startDate: certificate.startDate,
        endDate: certificate.endDate,
        workload: certificate.workload,
        status: "issued",
      };

      const response = await api.post<CertificateResponse>('/api/certificates/', payload);
      
      // Atualizar certificado com resposta do backend
      certificate.id = response.data.id;
      certificate.status = "issued";
      certificate.verificationCode = response.data.verificationCode;
      
      // Atualizar no localStorage
      this.saveCertificateLocally(certificate);
      
      return certificate;
    } catch (error) {
      console.warn('Erro ao sincronizar certificado com backend:', error);
      // Mesmo com erro, o certificado é mantido localmente com status 'visual'
      return certificate;
    }
    */

    return certificate;
  }

  /**
   * Recupera todos os certificados do usuário atual
   */
  async getUserCertificates(userId: number): Promise<Certificate[]> {
    // Primeiro, tentar recuperar do localStorage
    const localCertificates = this.getCertificatesFromStorage(userId);

    // TODO: INTEGRAÇÃO COM BACKEND (comentada)
    // Descomente quando backend estiver pronto
    /*
    try {
      const response = await api.get<CertificateResponse[]>('/api/certificates/me/');
      
      if (response.data && Array.isArray(response.data)) {
        // Mapear resposta do backend para nosso tipo local
        const backendCerts: Certificate[] = response.data.map(cert => ({
          id: cert.id,
          userId: cert.userId,
          trailId: cert.trailId,
          trailName: cert.trailName,
          studentName: cert.studentName,
          startDate: cert.startDate,
          endDate: cert.endDate,
          workload: cert.workload,
          issuedAt: cert.issuedAt,
          status: 'issued',
          verificationCode: cert.verificationCode,
        }));

        // Mesclar com certificados locais (locais têm prioridade)
        const merged = this.mergeCertificates(localCertificates, backendCerts);
        return merged;
      }
    } catch (error) {
      console.warn('Erro ao buscar certificados do backend:', error);
      // Se falhar, retorna apenas os locais
    }
    */

    return localCertificates;
  }

  /**
   * Sincroniza certificados pendentes com o backend
   * Útil para sincronizar certificados criados offline
   */
  async syncPendingCertificates(userId: number): Promise<void> {
    const pendingCertificates = this.getPendingCertificates(userId);

    if (pendingCertificates.length === 0) {
      return;
    }

    // TODO: INTEGRAÇÃO COM BACKEND (comentada)
    // Descomente quando backend estiver pronto
    /*
    for (const certificate of pendingCertificates) {
      try {
        const payload: CertificatePayload = {
          userId: certificate.userId,
          trailId: certificate.trailId,
          trailName: certificate.trailName,
          studentName: certificate.studentName,
          startDate: certificate.startDate,
          endDate: certificate.endDate,
          workload: certificate.workload,
          status: "issued",
        };

        const response = await api.post<CertificateResponse>('/api/certificates/', payload);
        
        // Atualizar certificado com resposta do backend
        certificate.id = response.data.id;
        certificate.status = "issued";
        certificate.verificationCode = response.data.verificationCode;
        
        // Atualizar no localStorage
        this.saveCertificateLocally(certificate);
        
        // Remover de pendentes
        this.removePendingCertificate(userId, certificate.id!);
      } catch (error) {
        console.error('Erro ao sincronizar certificado:', error);
        // Deixar para tentar novamente depois
      }
    }
    */
  }

  /**
   * Formata datas para exibição no formato PT-BR
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  /**
   * Verifica se a trilha foi concluída 100%
   * Esta função deve ser chamada antes de gerar o certificado
   */
  isTrailComplete(completionPercentage: number): boolean {
    return completionPercentage === 100;
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private generateCertificateId(): string {
    return `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveCertificateLocally(certificate: Certificate): void {
    try {
      const certificates = this.getCertificatesFromStorage(certificate.userId);
      
      // Remover certificado existente com mesmo ID (atualização)
      const filtered = certificates.filter(c => c.id !== certificate.id);
      filtered.push(certificate);

      const byUser = this.getAllCertificatesFromStorage();
      byUser[certificate.userId] = filtered;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(byUser));
    } catch (error) {
      console.error("Erro ao salvar certificado localmente:", error);
    }
  }

  private getCertificatesFromStorage(userId: number): Certificate[] {
    try {
      const allCerts = this.getAllCertificatesFromStorage();
      return allCerts[userId] || [];
    } catch (error) {
      console.error("Erro ao recuperar certificados do localStorage:", error);
      return [];
    }
  }

  private getAllCertificatesFromStorage(): Record<number, Certificate[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private getPendingCertificates(userId: number): Certificate[] {
    const certificates = this.getCertificatesFromStorage(userId);
    return certificates.filter(c => c.status === "pending_sync" || c.status === "visual");
  }

  private removePendingCertificate(userId: number, certificateId: string): void {
    try {
      const certificates = this.getCertificatesFromStorage(userId);
      const filtered = certificates.filter(c => c.id !== certificateId);
      
      const byUser = this.getAllCertificatesFromStorage();
      byUser[userId] = filtered;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(byUser));
    } catch (error) {
      console.error("Erro ao remover certificado pendente:", error);
    }
  }

  private mergeCertificates(
    localCerts: Certificate[],
    backendCerts: Certificate[]
  ): Certificate[] {
    // Locais têm prioridade (mais recentes)
    const backendIds = new Set(backendCerts.map(c => c.id));
    const unique = localCerts.filter(c => !backendIds.has(c.id));
    return [...localCerts, ...unique];
  }
}

export default new CertificateService();
