/**
 * CERTIFICADO TEMPLATE - COMPONENTE UNIFICADO
 *
 * Design Premium FAURG - Azul/Branco
 * Utilizado em:
 * - Tela de conclusão da trilha
 * - Tela de "Meus Certificados" (visualização)
 * - Download em PDF
 * - Impressão
 *
 * Garantia: Sempre o mesmo visual em qualquer lugar!
 */

import React from "react";
import FaurgLogo from "../assets/FAURG_LOGO.svg";
import type { Certificate } from "../types/certificate";

interface CertificateTemplateProps {
  certificate: Certificate;
  trailName: string;
  isForPrint?: boolean;
}

export const CertificateTemplate: React.FC<CertificateTemplateProps> = ({
  certificate,
  trailName,
  isForPrint = false,
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR");
    } catch {
      return dateString;
    }
  };

  return (
    <div
      id="certificate-print-area"
      className="bg-white"
      style={{
        aspectRatio: "297/210",
        overflow: "hidden",
        margin: 0,
        padding: 0,
      }}
    >
      <div
        className="relative flex h-full w-full flex-col"
        style={{ background: "#ffffff", margin: 0, padding: 0 }}
      >
        {/* Header com Barra Azul */}
        <div
          className="relative w-full"
          style={{
            height: "44px",
            background: "#002855",
            margin: 0,
            padding: 0,
          }}
        >
        </div>

        {/* Conteúdo do Certificado */}
        <div className="relative flex flex-1 flex-col">
          {/* Logo Institucional FAURG como Marca d'água - DESABILITADA PARA PDF */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.045] print:hidden" style={{ display: "none" }}>
            <img
              src={FaurgLogo}
              alt="Logo FAURG"
              className="h-[820px] w-auto object-contain"
              style={{ filter: "grayscale(30%)" }}
            />
          </div>

          {/* Borda Interna Fina e Elegante */}
          <div
            className="absolute rounded-sm border border-[#003D7A]/8"
            style={{
              borderWidth: "0.5px",
              top: "48px",
              bottom: "20px",
              left: "48px",
              right: "48px",
            }}
          ></div>

          {/* Conteúdo Principal */}
          <div className="relative z-10 flex flex-1 items-center">
            <div className="mx-auto w-full max-w-[680px] space-y-7 px-16 py-12">
              {/* Título Refinado */}
              <div className="text-center">
                <div className="mb-2.5 flex items-center justify-center">
                  <div
                    className="h-px w-20"
                    style={{
                      background:
                        "linear-gradient(to right, transparent, #003D7A, transparent)",
                    }}
                  ></div>
                  <div
                    className="mx-4 text-xs font-semibold tracking-[0.35em] uppercase"
                    style={{ color: "rgba(0, 61, 122, 0.6)" }}
                  >
                    Certificado
                  </div>
                  <div
                    className="h-px w-20"
                    style={{
                      background:
                        "linear-gradient(to right, transparent, #003D7A, transparent)",
                    }}
                  ></div>
                </div>
                <h1 className="font-serif text-[2.2rem] leading-tight font-bold tracking-tight text-[#1a1a1a]">
                  CERTIFICADO DE CONCLUSÃO
                </h1>
                <div
                  className="mx-auto mt-4 h-1 w-24"
                  style={{
                    background:
                      "linear-gradient(to right, transparent, #003D7A, transparent)",
                  }}
                ></div>
              </div>

              {/* Texto de Certificação com Tipografia Refinada */}
              <div className="mx-auto max-w-[600px] space-y-4 px-2 text-center leading-relaxed font-light text-gray-800">
                <p className="text-[1.02rem] leading-relaxed">
                  Certificamos que{" "}
                  <strong className="font-semibold text-[#1a1a1a]">
                    {certificate.studentName || certificate.nome_aluno}
                  </strong>{" "}
                  concluiu com êxito{" "}
                  <strong className="font-semibold text-[#1a1a1a]">
                    {trailName || certificate.trailName}
                  </strong>
                  , realizado no período de{" "}
                  <strong className="font-semibold text-[#1a1a1a]">
                    {formatDate(
                      certificate.startDate || certificate.data_emissao,
                    )}
                  </strong>{" "}
                  a{" "}
                  <strong className="font-semibold text-[#1a1a1a]">
                    {formatDate(
                      certificate.endDate || certificate.data_emissao,
                    )}
                  </strong>
                  , com carga horária total de{" "}
                  <strong className="font-semibold text-[#1a1a1a]">
                    {certificate.workload || certificate.carga_horaria || 40}{" "}
                    horas
                  </strong>
                  .
                </p>

                <p className="text-[0.95rem] leading-relaxed text-gray-700">
                  Esse curso teve por objetivo integrar colaboradores à cultura,
                  missão, processos e boas práticas da FAURG, fortalecendo o
                  engajamento com os princípios de excelência no apoio à
                  educação, pesquisa, inovação e desenvolvimento institucional.
                </p>
              </div>

              {/* Rodapé com Layout Otimizado */}
              <div className="pt-8">
                <div className="flex items-start justify-between px-2">
                  {/* Coluna Esquerda: Data e Local */}
                  <div className="flex-1">
                    <p className="text-xs leading-tight font-light text-gray-700">
                      Rio Grande,{" "}
                      <strong className="font-medium">
                        {formatDate(
                          certificate.issuedAt || certificate.data_emissao,
                        )}
                      </strong>
                      .
                    </p>
                  </div>

                  {/* Coluna Direita: Assinatura */}
                  <div className="flex flex-1 flex-col items-end px-4">
                    {/* Assinatura */}
                    <div className="text-center">
                      <div
                        className="mb-1 h-px w-56"
                        style={{
                          background:
                            "linear-gradient(to right, transparent, #9ca3af, transparent)",
                        }}
                      ></div>
                      <p className="text-xs leading-tight font-medium tracking-wide text-gray-800 uppercase">
                        [ASSINATURA]
                      </p>
                      <p className="mt-0.5 text-[0.7rem] font-light tracking-widest text-gray-500 uppercase">
                        [NOME RESPONSÁVEL]
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer com Logo e Detalhes */}
        <div
          className="relative w-full"
          style={{
            height: "44px",
            background: "#002855",
            margin: 0,
            padding: 0,
          }}
        >
        </div>
      </div>

      {/* Estilos de Impressão */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          
          #certificate-print-area {
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: avoid;
          }
          
          #certificate-print-area * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default CertificateTemplate;
