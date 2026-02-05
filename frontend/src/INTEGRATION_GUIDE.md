/**
 * GUIA DE INTEGRAÇÃO PRÁTICA
 * 
 * Este arquivo mostra exatamente onde e como integrar o sistema de certificados
 * aos seus componentes existentes (TrailDetail, ModuleDetail, etc.)
 */

// ============================================================================
// 1. INTEGRAR EM UM COMPONENTE DE DETALHE DE TRILHA
// ============================================================================

/*

ARQUIVO: src/pages/TrailDetail.tsx (OU SIMILAR)

Adicione as seguintes importações:

import { useCertificates } from "../hooks/useCertificates";
import TrailCompletionCertificate from "../components/TrailCompletionCertificate";
import certificateService from "../services/certificates.service";

Adicione ao componente:

export function TrailDetail({ trailId }: Props) {
  const { user } = useAuth(); // Assumindo que você tem um hook de autenticação
  const { issueCertificate } = useCertificates();
  
  // Estados da trilha (já existentes)
  const [trail, setTrail] = useState<Trail | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  
  // Novos estados para certificado
  const [showCertificate, setShowCertificate] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [hasIssuedCertificate, setHasIssuedCertificate] = useState(false);

  // Efeito para gerar certificado ao atingir 100%
  useEffect(() => {
    if (
      completionPercentage === 100 &&
      !hasIssuedCertificate &&
      trail &&
      user
    ) {
      const issueCert = async () => {
        try {
          const startDate = trail.created_at?.split('T')[0] || new Date().toISOString().split('T')[0];
          const endDate = new Date().toISOString().split('T')[0];
          
          // Calcular horas da trilha (exemplo)
          const workload = trail.modules?.length * 10 || 40; // Ajustar conforme sua lógica
          
          const cert = await issueCertificate(
            user.id,
            trail.id,
            trail.titulo,
            user.nome_completo || user.username,
            startDate,
            endDate,
            workload
          );
          
          setCertificate(cert);
          setShowCertificate(true);
          setHasIssuedCertificate(true);
        } catch (error) {
          console.error("Erro ao gerar certificado:", error);
        }
      };

      issueCert();
    }
  }, [completionPercentage, hasIssuedCertificate, trail, user, issueCertificate]);

  return (
    <div>
      {/* Seu conteúdo de trilha existente */}
      <h1>{trail?.titulo}</h1>
      <div className="progress-bar">
        <div style={{ width: `${completionPercentage}%` }} />
      </div>

      {/* Modal de celebração e certificado */}
      {showCertificate && certificate && (
        <TrailCompletionCertificate
          trailName={trail?.titulo || ""}
          studentName={user?.nome_completo || user?.username || ""}
          certificate={certificate}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
}

*/

// ============================================================================
// 2. CRIAR PÁGINA DE "MEUS CERTIFICADOS"
// ============================================================================

/*

ARQUIVO: src/pages/MyCertificates.tsx (NOVO)

import React, { useEffect } from "react";
import { useCertificates } from "../hooks/useCertificates";
import CertificatePreview from "../components/CertificatePreview";
import { useAuth } from "../hooks/useAuth";
import { Certificate } from "../types/certificate";

export function MyCertificates() {
  const { user } = useAuth();
  const { certificates, isLoading, getCertificates, error } = useCertificates();
  const [selectedCert, setSelectedCert] = React.useState<Certificate | null>(null);

  useEffect(() => {
    if (user?.id) {
      getCertificates(user.id);
    }
  }, [user?.id, getCertificates]);

  if (isLoading) {
    return <div className="p-8 text-center">⏳ Carregando certificados...</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        ❌ Erro ao carregar certificados: {error}
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="rounded-lg bg-blue-50 p-8 text-center">
        <p className="text-lg text-blue-900">📜 Nenhum certificado ainda</p>
        <p className="mt-2 text-sm text-blue-700">
          Complete uma trilha 100% para receber um certificado
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">📜 Meus Certificados</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {certificates.map((cert) => (
          <div
            key={cert.id}
            onClick={() => setSelectedCert(cert)}
            className="cursor-pointer rounded-lg border-2 border-gray-200 p-6 transition-all hover:border-blue-500 hover:shadow-lg"
          >
            <div className="mb-4 text-4xl">📜</div>
            <h3 className="text-lg font-bold text-gray-900">
              {cert.trailName}
            </h3>
            <p className="mt-1 text-sm text-gray-600">{cert.studentName}</p>
            <p className="mt-2 text-xs text-gray-500">
              {cert.workload} horas • {new Date(cert.endDate).toLocaleDateString("pt-BR")}
            </p>
            <div className="mt-4 flex gap-2">
              {cert.status === "visual" && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  Local
                </span>
              )}
              {cert.status === "issued" && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                  Emitido
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedCert && (
        <CertificatePreview
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
          showPrintButton={true}
        />
      )}
    </div>
  );
}

export default MyCertificates;

*/

// ============================================================================
// 3. ADICIONAR CERTIFICADOS AO MENU DE NAVEGAÇÃO
// ============================================================================

/*

ARQUIVO: src/components/Navigation.tsx (OU SIMILAR)

import { Link } from "react-router-dom";

export function Navigation() {
  return (
    <nav className="flex gap-6">
      <Link to="/">Home</Link>
      <Link to="/trilhas">Trilhas</Link>
      <Link to="/certificados">📜 Certificados</Link>  {/* NOVO */}
      <Link to="/perfil">Perfil</Link>
    </nav>
  );
}

*/

// ============================================================================
// 4. VERIFICAR CONCLUSÃO NO COMPONENTE DE MÓDULOS
// ============================================================================

/*

ARQUIVO: src/pages/ModuleDetail.tsx

// Adicionar hook
import { useCertificates } from "../hooks/useCertificates";
import certificateService from "../services/certificates.service";

// Dentro do componente, quando o módulo é completado:

const handleCompleteModule = async () => {
  // ... seu código de conclusão existente
  
  // Verificar se a trilha foi completada 100%
  const updatedCompletion = calculateTrailCompletion();
  
  if (certificateService.isTrailComplete(updatedCompletion)) {
    // Solicitar geração de certificado (pode vir do componente pai)
    console.log("🎉 Trilha 100% completa! Gerar certificado...");
  }
};

*/

// ============================================================================
// 5. SINCRONIZAR CERTIFICADOS AO FAZER LOGIN
// ============================================================================

/*

ARQUIVO: src/hooks/useAuth.ts (OU SIMILAR)

import { useCertificates } from "./useCertificates";

export function useAuth() {
  const { syncCertificates } = useCertificates();
  
  const login = async (username: string, password: string) => {
    // ... seu código de login existente
    
    // Após login bem-sucedido
    const user = await api.post("/login", { username, password });
    
    // Sincronizar certificados pendentes
    if (user.id) {
      syncCertificates(user.id).catch(err => 
        console.warn("Erro ao sincronizar certificados:", err)
      );
    }
    
    return user;
  };
  
  return { login, /* ... outros retornos */ };
}

*/

// ============================================================================
// 6. ADICIONAR BADGE DE CERTIFICADOS NO DASHBOARD
// ============================================================================

/*

ARQUIVO: src/pages/Dashboard.tsx

import { useCertificates } from "../hooks/useCertificates";
import { useAuth } from "../hooks/useAuth";

export function Dashboard() {
  const { user } = useAuth();
  const { certificates } = useCertificates();

  useEffect(() => {
    if (user?.id) {
      getCertificates(user.id);
    }
  }, [user?.id]);

  const certCount = certificates.filter(c => c.status === "issued").length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Card de Certificados */}
      {certCount > 0 && (
        <div className="rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100 p-6">
          <div className="text-4xl">🏆</div>
          <h3 className="mt-2 font-bold text-gray-900">Certificados</h3>
          <p className="mt-1 text-2xl font-bold text-amber-900">
            {certCount}
          </p>
          <a
            href="/certificados"
            className="mt-4 block rounded bg-amber-600 px-4 py-2 text-center text-sm text-white hover:bg-amber-700"
          >
            Ver Certificados →
          </a>
        </div>
      )}
    </div>
  );
}

*/

// ============================================================================
// DICAS IMPORTANTES
// ============================================================================

/*

1. CÁLCULO DE CONCLUSÃO:
   - A conclusão deve ser calculada como: (módulos_completos / módulos_totais) * 100
   - Certifique-se de que quando atinge 100%, o certificado é gerado

2. DATA DE INÍCIO:
   - Você pode usar a data de criação da trilha ou da inscrição do usuário
   - Formato obrigatório: YYYY-MM-DD

3. CARGA HORÁRIA:
   - Calcule baseado no número de módulos ou duração estimada
   - Ou obtenha do banco de dados da trilha

4. NOMES:
   - studentName: Use user.nome_completo ou user.username
   - trailName: Use trail.titulo ou trail.name

5. SINCRONIZAÇÃO COM BACKEND:
   - Chame syncCertificates quando o usuário fizer login
   - Descomentar o código no service quando backend estiver pronto

6. PARA DESENVOLVIMENTO LOCAL:
   - O sistema funciona 100% com localStorage
   - Não há necessidade de backend para testar
   - Descomentar REST calls quando backend estiver pronto

*/

export default undefined;
