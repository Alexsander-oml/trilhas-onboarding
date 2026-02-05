import React, { useState } from "react";
import { useCertificates } from "../hooks/useCertificates";
import { TrailCompletionCertificate } from "../components/TrailCompletionCertificate";
import type { Certificate } from "../types/certificate";

export function TestCertificatePage() {
  const { issueCertificate, certificates, getCertificates } = useCertificates();
  const [showCertificate, setShowCertificate] = useState(false);
  const [testCert, setTestCert] = useState<Certificate | null>(null);

  const handleCreateTestCertificate = () => {
    const userId = 1; // Substitua pelo ID real do usuário
    const trailId = 42;

    const cert = issueCertificate(
      userId,
      trailId,
      "Trail de Teste",
      "Usuário Teste",
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      new Date().toISOString(),
      40,
    );

    if (cert) {
      setTestCert(cert);
      setShowCertificate(true);
      console.log("✅ Certificado criado:", cert);
    }
  };

  const handleLoadCertificates = () => {
    const userId = 1;
    const certs = getCertificates(userId);
    console.log("📜 Certificados do usuário:", certs);
  };

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-3xl font-bold">
        🧪 Teste do Sistema de Certificação
      </h1>

      <div className="mb-8 space-y-4">
        <button
          onClick={handleCreateTestCertificate}
          className="rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700"
        >
          ✨ Criar Certificado de Teste
        </button>

        <button
          onClick={handleLoadCertificates}
          className="ml-4 rounded-lg bg-green-600 px-6 py-3 text-white transition hover:bg-green-700"
        >
          📋 Carregar Certificados Salvos
        </button>
      </div>

      {/* Display dos certificados salvos */}
      <div className="mb-8 rounded-lg bg-gray-100 p-6">
        <h2 className="mb-4 text-xl font-bold">
          Certificados Armazenados ({certificates.length})
        </h2>
        {certificates.length > 0 ? (
          <div className="space-y-4">
            {certificates.map((cert, idx) => (
              <div
                key={idx}
                className="rounded border-l-4 border-blue-600 bg-white p-4"
              >
                <p>
                  <strong>Trilha:</strong> {cert.trailName}
                </p>
                <p>
                  <strong>Aluno:</strong> {cert.studentName}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span className="rounded bg-yellow-200 px-2 py-1 text-sm">
                    {cert.status}
                  </span>
                </p>
                <p>
                  <strong>Carga Horária:</strong> {cert.workload}h
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Nenhum certificado salvo ainda</p>
        )}
      </div>

      {/* Mostrar certificado visual */}
      {showCertificate && testCert && (
        <TrailCompletionCertificate
          certificate={testCert}
          onClose={() => setShowCertificate(false)}
        />
      )}

      {/* Verificação de localStorage */}
      <div className="rounded-lg bg-blue-50 p-6">
        <h3 className="mb-4 text-lg font-bold">📍 Dicas de Debug</h3>
        <ol className="list-inside list-decimal space-y-2 text-sm">
          <li>Abra DevTools (F12) → Application → Local Storage</li>
          <li>
            Procure por chaves que começam com{" "}
            <code className="bg-gray-200 px-2">certificate_</code>
          </li>
          <li>Verifique o console para mensagens de sucesso</li>
          <li>Inspecione a estrutura JSON salva</li>
        </ol>
      </div>
    </div>
  );
}
