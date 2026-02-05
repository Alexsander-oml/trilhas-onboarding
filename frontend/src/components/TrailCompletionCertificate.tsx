/**
 * TrailCompletionCertificate Component
 *
 * Componente que exibe uma celebração quando o usuário completa uma trilha 100%
 * e oferece a opção de gerar/visualizar o certificado
 */

import React, { useState } from "react";
import type { Certificate } from "../types/certificate";
import CertificatePreview from "./CertificatePreview";

interface TrailCompletionCertificateProps {
  trailName: string;
  studentName: string;
  certificate: Certificate | null;
  onClose?: () => void;
}

export const TrailCompletionCertificate: React.FC<
  TrailCompletionCertificateProps
> = ({ trailName, studentName, certificate, onClose }) => {
  const [showCertificate, setShowCertificate] = useState(false);

  if (!certificate) {
    return null;
  }

  if (showCertificate) {
    return (
      <CertificatePreview
        certificate={certificate}
        onClose={() => {
          setShowCertificate(false);
          if (onClose) onClose();
        }}
        showPrintButton={true}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-blue-900 to-blue-600 p-4">
      {/* Confete Animation */}
      <div className="pointer-events-none fixed inset-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10px`,
              animation: `fall ${2 + Math.random() * 3}s ease-in forwards`,
              animationDelay: `${Math.random() * 0.5}s`,
            }}
          >
            {["🎉", "🎊", "⭐", "✨", "🏆"][Math.floor(Math.random() * 5)]}
          </div>
        ))}
      </div>

      {/* Conteúdo Principal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* Ícone de Celebração */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600">
            <span className="text-5xl">🏆</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Parabéns!</h1>
        </div>

        {/* Mensagem */}
        <div className="space-y-4 text-center">
          <p className="text-lg text-gray-700">
            <span className="font-semibold">{studentName}</span>, você concluiu
            com êxito a trilha
          </p>
          <p className="text-2xl font-bold text-blue-600">{trailName}</p>

          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-gray-700">
              ✨ Você desbloqueou um certificado de conclusão!
            </p>
          </div>

          <p className="text-sm text-gray-600">
            Seu certificado já está pronto para ser visualizado e impresso.
          </p>
        </div>

        {/* Botões */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => setShowCertificate(true)}
            className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/50 active:scale-95"
          >
            📜 Ver Certificado
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50"
          >
            ← Continuar
          </button>
        </div>

        {/* Status Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-4 py-2">
          <span className="text-sm text-amber-800">
            {certificate.status === "visual" && (
              <>
                <span className="inline-block h-2 w-2 rounded-full bg-amber-600"></span>{" "}
                Certificado Local
              </>
            )}
            {certificate.status === "issued" && (
              <>
                <span className="inline-block h-2 w-2 rounded-full bg-green-600"></span>{" "}
                Certificado Emitido
              </>
            )}
          </span>
        </div>
      </div>

      {/* Estilos de Animação */}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default TrailCompletionCertificate;
