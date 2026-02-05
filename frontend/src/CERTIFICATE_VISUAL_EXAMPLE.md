/**
 * EXEMPLO VISUAL - Sistema de Certificação em Ação
 * 
 * Este arquivo mostra passo a passo como o sistema funciona
 * com exemplo prático e visual
 */

// ============================================================================
// PASSO 1: Setup Inicial
// ============================================================================

/*

src/pages/TrailDetail.tsx

import React, { useState, useEffect } from 'react';
import { useCertificates } from '../hooks/useCertificates';
import TrailCompletionCertificate from '../components/TrailCompletionCertificate';
import certificateService from '../services/certificates.service';

interface TrailDetailProps {
  trailId: number;
}

export function TrailDetail({ trailId }: TrailDetailProps) {
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [certificate, setCertificate] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);
  
  // ✅ 1. Usar o hook de certificados
  const { issueCertificate } = useCertificates();

*/

// ============================================================================
// PASSO 2: Simular Conclusão de Trilha
// ============================================================================

/*

  // Simular progresso de trilha (25%, 50%, 75%, 100%)
  const handleCompleteModule = async () => {
    setCompletionPercentage(prev => {
      const newPercentage = prev + 25;
      return newPercentage > 100 ? 100 : newPercentage;
    });
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold">Trilha de Onboarding</h1>
        <p className="text-gray-600">Desenvolvendo suas habilidades...</p>
      </div>

      {/* Barra de Progresso */}
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className="bg-blue-600 h-4 rounded-full transition-all duration-500"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
      <p className="text-lg font-semibold">{completionPercentage}% Concluído</p>

      {/* Módulos (simulados) */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map(module => (
          <div key={module} className="p-4 border rounded-lg">
            <h3>Módulo {module}</h3>
            <button
              onClick={handleCompleteModule}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded"
            >
              ✓ Marcar como Completo
            </button>
          </div>
        ))}
      </div>

      {/* Certificado */}
      {showCertificate && certificate && (
        <TrailCompletionCertificate
          trailName="Trilha de Onboarding"
          studentName="João Silva"
          certificate={certificate}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
}

*/

// ============================================================================
// PASSO 3: Efeito para Gerar Certificado
// ============================================================================

/*

export function TrailDetail({ trailId }: TrailDetailProps) {
  // ... estados anteriores

  // ✅ 2. Verificar quando atinge 100%
  useEffect(() => {
    if (completionPercentage === 100 && !certificate) {
      const generateCertificate = async () => {
        console.log('🎉 Trilha 100% completa! Gerando certificado...');

        // ✅ 3. Chamar service para gerar certificado
        const cert = await issueCertificate(
          1,                              // userId (obter do contexto real)
          42,                             // trailId
          "Trilha de Onboarding",        // trailName
          "João Silva",                   // studentName (obter do usuário)
          "2024-01-15",                   // startDate (data de início)
          new Date().toISOString().split('T')[0],  // endDate (hoje)
          40                              // workload (horas)
        );

        console.log('✅ Certificado gerado:', cert);
        setCertificate(cert);
        setShowCertificate(true);
      };

      generateCertificate().catch(error => {
        console.error('❌ Erro ao gerar certificado:', error);
      });
    }
  }, [completionPercentage, certificate, issueCertificate]);

  // ... resto do componente
}

*/

// ============================================================================
// PASSO 4: Saída Console (O que você vê)
// ============================================================================

/*

Console do navegador:

> 🎉 Trilha 100% completa! Gerando certificado...
> ✅ Certificado gerado: {
    id: "cert_1705751400123_a1b2c3d4e5f",
    userId: 1,
    trailId: 42,
    trailName: "Trilha de Onboarding",
    studentName: "João Silva",
    startDate: "2024-01-15",
    endDate: "2024-02-01",
    workload: 40,
    issuedAt: "2024-02-01T10:30:00.000Z",
    status: "visual"
  }

> localStorage.certificates: {
    "1": [
      { ... certificado salvo ... }
    ]
  }

*/

// ============================================================================
// PASSO 5: Tela de Celebração
// ============================================================================

/*

Quando certificado é gerado, a tela mostra:

┌──────────────────────────────────────────┐
│                                          │
│  🎉  🎊  ⭐  ✨  🏆                       │
│      (confete caindo)                    │
│                                          │
│  ╔════════════════════════════════════╗  │
│  ║         🏆 PARABÉNS!               ║  │
│  ║                                    ║  │
│  ║  João Silva, você concluiu com     ║  │
│  ║  êxito a Trilha de Onboarding      ║  │
│  ║                                    ║  │
│  ║  ✨ Você desbloqueou um             ║  │
│  ║  certificado de conclusão!         ║  │
│  ║                                    ║  │
│  ║  [📜 Ver Certificado]              ║  │
│  ║  [← Continuar]                     ║  │
│  ║                                    ║  │
│  ║  ● Certificado Local               ║  │
│  ╚════════════════════════════════════╝  │
│                                          │
└──────────────────────────────────────────┘

*/

// ============================================================================
// PASSO 6: Clique em "Ver Certificado"
// ============================================================================

/*

Exibe CertificatePreview:

╔════════════════════════════════════════════════════════════╗
║  Certificado de Conclusão        [🖨️ Imprimir] [⬇️ Baixar] ║
╠════════════════════════════════════════════════════════════╣
║                                                            ║
║  ╔────────────────────────────────────────────────────╗   ║
║  ║                                                    ║   ║
║  ║              CERTIFICADO                          ║   ║
║  ║             DE CONCLUSÃO                          ║   ║
║  ║                                                    ║   ║
║  ║  Certificamos que                                 ║   ║
║  ║                                                    ║   ║
║  ║           João Silva                              ║   ║
║  ║  ────────────────────────────                     ║   ║
║  ║                                                    ║   ║
║  ║  Concluiu com êxito a Trilha Trilha de            ║   ║
║  ║  Onboarding, realizada no período de              ║   ║
║  ║  15 de janeiro de 2024 a 1 de fevereiro           ║   ║
║  ║  de 2024, com carga horária total de              ║   ║
║  ║  40 horas.                                         ║   ║
║  ║                                                    ║   ║
║  ║  Esta trilha de aprendizado foi desenvolvida       ║   ║
║  ║  em consonância com a cultura, missão, valores     ║   ║
║  ║  e boas práticas institucionais, visando           ║   ║
║  ║  fortalecer o desenvolvimento profissional...      ║   ║
║  ║                                                    ║   ║
║  ║  Expedido em 1 de fevereiro de 2024               ║   ║
║  ║                                                    ║   ║
║  ║          ──────────────────                        ║   ║
║  ║          Responsável pela Emissão                  ║   ║
║  ║                                                    ║   ║
║  ║  Código: cert_1705751400123_a1b2c3d4e5f            ║   ║
║  ║  Status: visual                                    ║   ║
║  ║                                                    ║   ║
║  ╚────────────────────────────────────────────────────╝   ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

*/

// ============================================================================
// PASSO 7: Clicar em "🖨️ Imprimir"
// ============================================================================

/*

Abre diálogo de impressão:

┌─────────────────────────────────┐
│  Imprimir                      ✕│
├─────────────────────────────────┤
│                                 │
│  Destino: [Salvar como PDF ▼]   │
│                                 │
│  [Mais configurações ▼]         │
│                                 │
│     [  Cancelar ]  [ Salvar ]   │
│                                 │
└─────────────────────────────────┘

→ Gera arquivo PDF com o certificado

*/

// ============================================================================
// PASSO 8: Clicar em "⬇️ Baixar"
// ============================================================================

/*

Baixa arquivo HTML:

Downloads/
└── certificado_João_Silva_Trilha_de_Onboarding.html

Arquivo pode ser:
- Aberto em qualquer navegador
- Impresso novamente
- Compartilhado
- Armazenado

*/

// ============================================================================
// PASSO 9: Verificar localStorage
// ============================================================================

/*

No console:

> JSON.parse(localStorage.getItem('certificates'))

{
  "1": [
    {
      "id": "cert_1705751400123_a1b2c3d4e5f",
      "userId": 1,
      "trailId": 42,
      "trailName": "Trilha de Onboarding",
      "studentName": "João Silva",
      "startDate": "2024-01-15",
      "endDate": "2024-02-01",
      "workload": 40,
      "issuedAt": "2024-02-01T10:30:00Z",
      "status": "visual",
      "verificationCode": undefined  // Será preenchido após backend
    }
  ]
}

*/

// ============================================================================
// PASSO 10: Sincronizar com Backend (Futuro)
// ============================================================================

/*

Quando Django estiver pronto, chamar:

const { syncCertificates } = useCertificates();

// Ao fazer login
useEffect(() => {
  if (user?.id) {
    syncCertificates(user.id);  // ← Sincroniza automáticamente
  }
}, [user?.id]);

Resultado:

Antes:  status = "visual"
        Certificado só em localStorage

Depois: status = "issued"
        Certificado no backend
        verificationCode = "CERT-ABC123-XYZ789"

*/

// ============================================================================
// PASSO 11: Página de Meus Certificados
// ============================================================================

/*

import { useCertificates } from '../hooks/useCertificates';
import CertificatePreview from '../components/CertificatePreview';

export function MyCertificates() {
  const { certificates, getCertificates } = useCertificates();
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    getCertificates(userId);
  }, [userId]);

  return (
    <div className="space-y-6">
      <h1>📜 Meus Certificados</h1>

      <div className="grid grid-cols-3 gap-4">
        {certificates.map(cert => (
          <div
            key={cert.id}
            onClick={() => setSelectedCert(cert)}
            className="p-4 border rounded cursor-pointer hover:shadow-lg"
          >
            <div className="text-4xl">📜</div>
            <h3 className="font-bold">{cert.trailName}</h3>
            <p className="text-sm text-gray-600">{cert.studentName}</p>
            <p className="text-xs text-gray-500">
              {cert.workload} horas • {new Date(cert.endDate).toLocaleDateString()}
            </p>
            <span className={`text-xs px-2 py-1 rounded ${
              cert.status === 'issued' 
                ? 'bg-green-100 text-green-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {cert.status === 'issued' ? 'Emitido' : 'Local'}
            </span>
          </div>
        ))}
      </div>

      {selectedCert && (
        <CertificatePreview
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
}

*/

// ============================================================================
// PASSO 12: Dashboard com Badge de Certificados
// ============================================================================

/*

export function Dashboard() {
  const { certificates } = useCertificates();

  const issuedCount = certificates.filter(c => c.status === 'issued').length;

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Cards existentes... */}

      {/* Novo card de certificados */}
      {issuedCount > 0 && (
        <div className="p-6 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100">
          <div className="text-4xl">🏆</div>
          <h3 className="text-lg font-bold mt-2">Certificados</h3>
          <p className="text-3xl font-bold text-amber-900">{issuedCount}</p>
          <a
            href="/certificados"
            className="mt-4 block text-center bg-amber-600 text-white py-2 rounded hover:bg-amber-700"
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
// RESUMO DO FLUXO COMPLETO
// ============================================================================

/*

USUÁRIO                          FRONTEND                        BACKEND
   │                               │                               │
   ├─ Completa Trilha 100%        │                               │
   │                        ┌─────┼───────────────────────────┐   │
   │                        │ useEffect detecta 100%         │   │
   │                        │ Chama issueCertificate()       │   │
   │                        │                                │   │
   │                        │ Service gera ID único          │   │
   │                        │ Status = "visual"              │   │
   │                        │ Salva em localStorage          │   │
   │                        │                                │   │
   │                        └────────────────────────────────┘   │
   │                               │                               │
   ├─ Vê celebração com confete   │                               │
   │  (TrailCompletionCertificate)│                               │
   │                               │                               │
   ├─ Clica "Ver Certificado"     │                               │
   │                        ┌─────┼───────────────────────────┐   │
   │                        │ CertificatePreview renderiza   │   │
   │                        │ Layout institucional           │   │
   │                        └─────┬───────────────────────────┘   │
   │                               │                               │
   ├─ Vê diploma visual            │                               │
   │                               │                               │
   ├─ Clica "Imprimir" ou "Baixar"│                               │
   │                        ┌─────┼───────────────────────────┐   │
   │                        │ Gera PDF ou HTML               │   │
   │                        └─────┬───────────────────────────┘   │
   │                               │                               │
   ├─ Salva certificado            │                               │
   │  (PDF ou arquivo HTML)         │                               │
   │                               │                               │
   └─ [FUTURO] Fazer login        │                               │
      (quando backend ativo)  ┌─────┼──────────────────┬──────────┼─────┐
                              │ syncCertificates()   │          │      │
                              │ chama: POST /api/    │          │ Recebe
                              │ certificates/        │          │ POST
                              │                      ├──────────┼──────→
                              │                      │          │
                              │                      │          │ Valida
                              │                      │          │ Cria BD
                              │                      │          │
                              │ Status = "issued"   │          │ Retorna
                              │ verificationCode=OK  │          │ ID+Code
                              │ Atualiza localStorage│←─────────┤
                              │                      │          │
                              └──────────────────────┘          │

*/

// ============================================================================
// DICAS E BEST PRACTICES
// ============================================================================

/*

1. SEMPRE verificar completionPercentage === 100
   if (completionPercentage === 100 && !certificate) {
     // Gerar certificado
   }

2. USAR try/catch para erros
   try {
     const cert = await issueCertificate(...);
   } catch (error) {
     console.error('Erro:', error);
     alert('Erro ao gerar certificado');
   }

3. VERIFICAR localStorage
   JSON.parse(localStorage.getItem('certificates'))

4. LIMPAR localStorage se necessário
   localStorage.removeItem('certificates')

5. TESTAR COM DIFERENTES USUÁRIOS
   // Cada usuário tem seus próprios certificados

6. NÃO ESQUECER DATAS
   startDate: "2024-01-15"  (YYYY-MM-DD)
   endDate: "2024-02-01"    (YYYY-MM-DD)

7. DOCUMENTAR workload (horas)
   workload: 40  // horas da trilha

*/

export default undefined;
