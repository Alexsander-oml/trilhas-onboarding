/**
 * Hook customizado para gerenciar certificados
 * 
 * Fornece funções e estados para trabalhar com certificados
 */

import { useState, useCallback } from "react";
import type { Certificate } from "../types/certificate";
import certificateService from "../services/certificates.service";

interface UseCertificatesReturn {
  certificates: Certificate[];
  isLoading: boolean;
  error: string | null;
  issueCertificate: (
    userId: number,
    trailId: number,
    trailName: string,
    studentName: string,
    startDate: string,
    endDate: string,
    workload: number
  ) => Promise<Certificate>;
  getCertificates: (userId: number) => Promise<void>;
  syncCertificates: (userId: number) => Promise<void>;
  clearError: () => void;
}

export const useCertificates = (): UseCertificatesReturn => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issueCertificate = useCallback(
    async (
      userId: number,
      trailId: number,
      trailName: string,
      studentName: string,
      startDate: string,
      endDate: string,
      workload: number
    ): Promise<Certificate> => {
      try {
        setIsLoading(true);
        setError(null);

        const certificate = await certificateService.issueCertificate(
          userId,
          trailId,
          trailName,
          studentName,
          startDate,
          endDate,
          workload
        );

        setCertificates((prev) => [...prev, certificate]);
        return certificate;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao gerar certificado";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getCertificates = useCallback(async (userId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const certs = await certificateService.getUserCertificates(userId);
      setCertificates(certs);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao recuperar certificados";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncCertificates = useCallback(async (userId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      await certificateService.syncPendingCertificates(userId);

      // Recarregar certificados após sincronização
      const certs = await certificateService.getUserCertificates(userId);
      setCertificates(certs);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao sincronizar certificados";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    certificates,
    isLoading,
    error,
    issueCertificate,
    getCertificates,
    syncCertificates,
    clearError,
  };
};
