/**
 * EXEMPLO DE INTEGRAÇÃO - Como usar o sistema de certificados
 * 
 * Este arquivo demonstra como integrar certificados em uma página de conclusão de trilha
 * Remova este arquivo após integrar em seus componentes reais
 */

import React, { useState, useEffect } from "react";
import { useCertificates } from "../hooks/useCertificates";
import TrailCompletionCertificate from "../components/TrailCompletionCertificate";
import CertificatePreview from "../components/CertificatePreview";
import { Certificate } from "../types/certificate";

/**
 * Exemplo 1: Componente que verifica conclusão e gera certificado
 */
export const TrailDetailWithCertificate: React.FC<{
  trailId: number;
  trailName: string;
  studentName: string;
  completionPercentage: number;
  startDate: string;
  endDate: string;
  workload: number;
  userId: number;
}> = ({
  trailId,
  trailName,
  studentName,
  completionPercentage,
  startDate,
  endDate,
  workload,
  userId,
}) => {
  const [showCompletion, setShowCompletion] = useState(false);
  const [issuedCertificate, setIssuedCertificate] = useState<Certificate | null>(null);
  const { issueCertificate } = useCertificates();

  useEffect(() => {
    // Verifica se a trilha foi completada 100%
    if (completionPercentage === 100 && !issuedCertificate) {
      // Só mostra a tela de conclusão uma vez
      const handleCompletion = async () => {
        try {
          const certificate = await issueCertificate(
            userId,
            trailId,
            trailName,
            studentName,
            startDate,
            endDate,
            workload
          );
          setIssuedCertificate(certificate);
          setShowCompletion(true);
        } catch (error) {
          console.error("Erro ao gerar certificado:", error);
        }
      };

      handleCompletion();
    }
  }, [completionPercentage, trailId, trailName, studentName, startDate, endDate, workload, userId, issueCertificate, issuedCertificate]);

  return (
    <div>
      {/* Seu conteúdo de trilha aqui */}
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{trailName}</h1>
        <p>Progresso: {completionPercentage}%</p>

        {/* Barra de progresso */}
        <div className="h-4 w-full rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Modal de Conclusão com Certificado */}
      {showCompletion && issuedCertificate && (
        <TrailCompletionCertificate
          trailName={trailName}
          studentName={studentName}
          certificate={issuedCertificate}
          onClose={() => setShowCompletion(false)}
        />
      )}
    </div>
  );
};

/**
 * Exemplo 2: Página de Meus Certificados
 */
export const MyCertificates: React.FC<{ userId: number }> = ({ userId }) => {
  const { certificates, isLoading, getCertificates } = useCertificates();
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  useEffect(() => {
    getCertificates(userId);
  }, [userId, getCertificates]);

  if (isLoading) {
    return <div className="text-center text-gray-600">Carregando certificados...</div>;
  }

  if (certificates.length === 0) {
    return (
      <div className="rounded-lg bg-blue-50 p-8 text-center">
        <p className="text-gray-700">Nenhum certificado ainda.</p>
        <p className="text-sm text-gray-600">
          Complete uma trilha 100% para receber um certificado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📜 Meus Certificados</h2>

      <div className="grid gap-4 md:grid-cols-2">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            className="cursor-pointer rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-500 hover:bg-blue-50"
            onClick={() => setSelectedCert(cert)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{cert.trailName}</h3>
                <p className="text-sm text-gray-600">{cert.studentName}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {cert.workload} horas • Concluído em {new Date(cert.endDate).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="ml-2 rounded-full bg-amber-100 p-2 text-2xl">
                📜
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {cert.status === "visual" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
                  Local
                </span>
              )}
              {cert.status === "issued" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                  Emitido
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {selectedCert && (
        <CertificatePreview
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
          showPrintButton={true}
        />
      )}
    </div>
  );
};

/**
 * Exemplo 3: Badge de certificado disponível
 */
export const CertificateAvailableBadge: React.FC<{
  certificates: Certificate[];
}> = ({ certificates }) => {
  const issuedCount = certificates.filter((c) => c.status === "issued").length;
  const visualCount = certificates.filter((c) => c.status === "visual").length;

  if (certificates.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 px-4 py-2">
      <span className="text-2xl">🏆</span>
      <span className="text-sm font-semibold text-amber-900">
        {issuedCount + visualCount} Certificado{issuedCount + visualCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
};

export default TrailDetailWithCertificate;
