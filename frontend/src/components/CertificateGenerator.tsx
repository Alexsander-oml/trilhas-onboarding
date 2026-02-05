/**
 * CERTIFICATE GENERATOR - Página de Geração e Visualização de Certificado
 *
 * FUNCIONALIDADES:
 * - Gera certificado ao completar trilha com 70%+ de aproveitamento
 * - Exibe informações do certificado (nome, trilha, data, código)
 * - Permite download do PDF do certificado
 * - Mostra código de verificação único
 * - Validação visual com design premium
 *
 * FLUXO:
 * 1. Usuário chega após completar 100% da trilha com 70%+
 * 2. Sistema chama API para gerar certificado
 * 3. Exibe certificado com opções de download e compartilhamento
 * 4. Registra certificado no histórico do usuário
 */

// @ts-expect-error - React types issue with esModuleInterop
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import FaurgLogo from "../assets/FAURG_LOGO.svg";
import html2canvas from "html2canvas";
import html2pdf from "html2pdf.js";
import certificateCSS from "../styles/certificate.css?raw";

interface CertificateData {
  codigo_verificacao: string;
  link_pdf?: string;
  data_emissao: string;
  nome_aluno: string;
  nome_trilha: string;
  carga_horaria?: number;
}

// Estilos de impressão para o certificado
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    #certificate-print-area, #certificate-print-area * {
      visibility: visible;
    }
    #certificate-print-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    @page {
      size: A4 landscape;
      margin: 0;
    }
  }
`;

const CertificateGenerator: React.FC = () => {
  const { trailId } = useParams<{ trailId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Determinar se é admin baseado na role do usuário
  const userRole = user?.role || (user as any)?.perfil?.nome || null;
  const isAdmin = userRole !== "Aprendiz";

  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trailName, setTrailName] = useState<string>("Trilha de Aprendizagem");

  const generateCertificate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar informações da trilha e usuário
      // O token é salvo como 'authToken' pelo authService
      const token =
        localStorage.getItem("authToken") ||
        localStorage.getItem("access_token");
      let userId = localStorage.getItem("user_id");

      // Se não houver user_id no localStorage, buscar do usuário logado
      if (!userId) {
        const userInfoStr = localStorage.getItem("user_info");
        if (userInfoStr) {
          try {
            const userInfo = JSON.parse(userInfoStr);
            userId = userInfo.id?.toString() || userInfo.user_id?.toString();
          } catch (e) {
            console.warn("Erro ao parsear user_info:", e);
          }
        }
      }

      // Também tentar buscar userId do currentUser
      if (!userId) {
        const currentUserStr = localStorage.getItem("currentUser");
        if (currentUserStr) {
          try {
            const currentUser = JSON.parse(currentUserStr);
            userId =
              currentUser.id?.toString() || currentUser.user_id?.toString();
          } catch (e) {
            console.warn("Erro ao parsear currentUser:", e);
          }
        }
      }

      // Tentar buscar da chave 'user' (formato usado pelo sistema)
      if (!userId) {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            userId =
              user.id?.toString() ||
              user.user_id?.toString() ||
              user.userId?.toString();
            console.log('📌 UserId encontrado na chave "user":', userId, user);
          } catch (e) {
            console.warn("Erro ao parsear user:", e);
          }
        }
      }

      console.log("🔍 Verificando autenticação:", {
        token: token ? "presente" : "ausente",
        userId,
        allKeys: Object.keys(localStorage).filter(
          (k) => k.includes("user") || k.includes("User"),
        ),
      });

      if (!token) {
        throw new Error(
          "Token de autenticação não encontrado. Faça login novamente.",
        );
      }

      if (!userId) {
        throw new Error("ID do usuário não encontrado. Faça login novamente.");
      }

      // Gerar certificado via API
      // O backend fará todas as validações necessárias (100% conclusão, 70% score, etc)
      console.log(
        "🎓 Gerando certificado para trilha",
        trailId,
        "usuário",
        userId,
      );
      const response = await fetch(
        `http://localhost:8000/api/certificado/gerar/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_trilha: parseInt(trailId!),
            id_usuario: parseInt(userId),
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Certificado gerado:", data);
        setCertificate(data);

        // Buscar nome da trilha do certificado retornado
        if (data.nome_trilha) {
          setTrailName(data.nome_trilha);
        }
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Erro desconhecido" }));
        const errorMessage =
          errorData.detail || errorData.error || "Erro ao gerar certificado";
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error("❌ Erro:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [trailId]);

  useEffect(() => {
    generateCertificate();

    // Injetar estilos de impressão
    if (!document.getElementById("certificate-print-styles")) {
      const style = document.createElement("style");
      style.id = "certificate-print-styles";
      style.textContent = printStyles;
      document.head.appendChild(style);
    }
  }, [generateCertificate]);

  const generatePDF = async () => {
    const printArea = document.getElementById("certificate-print-area");
    if (!printArea) {
      alert("Erro: Elemento do certificado não encontrado");
      return;
    }

    try {
      console.log("🎓 Iniciando geração de PDF do certificado...");

      // Injetar CSS estático do certificado (HEX apenas, sem oklch)
      const tempStyle = document.createElement("style");
      tempStyle.id = "certificate-static-css";
      tempStyle.textContent = certificateCSS;
      document.head.appendChild(tempStyle);

      // Aguardar renderização com o novo CSS
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Remover cantos arredondados APENAS para o PDF
      const originalBorderRadius = printArea.style.borderRadius;
      printArea.style.borderRadius = "0";

      // Forçar reflow e aguardar renderização
      void printArea.offsetHeight;
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Aplicar negrito APENAS aos elementos <strong> e datas do período para o PDF
      const dateElements: { element: HTMLElement; originalWeight: string }[] =
        [];

      const strongElements = printArea.querySelectorAll("strong");
      strongElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const originalWeight = htmlEl.style.fontWeight;
        htmlEl.style.fontWeight = "700";
        dateElements.push({ element: htmlEl, originalWeight });
      });

      // Encontrar e aplicar negrito às datas do período (formato dd/mm/yyyy)
      const allTextNodes = printArea.querySelectorAll("p");
      allTextNodes.forEach((p) => {
        if (p.textContent?.includes("realizado no período de")) {
          // Envolver datas em spans com negrito
          const dateRegex = /(\d{2}\/\d{2}\/\d{4})/g;
          const text = p.innerHTML;
          if (dateRegex.test(text)) {
            const originalHTML = p.innerHTML;
            p.innerHTML = text.replace(
              dateRegex,
              '<span style="font-weight: 700;">$1</span>',
            );
            // Guardar referência para restaurar
            dateElements.push({
              element: p as HTMLElement,
              originalWeight: originalHTML,
            });
          }
        }
      });

      // Dimensões exatas A4 landscape @ 300dpi (sem margens)
      // 297mm x 210mm = 3508 x 2480 pixels @ 300dpi
      const a4Width = 3508;
      const a4Height = 2480;

      // Converter todas as cores oklch/oklab para HEX antes de renderizar
      const allElements = printArea.querySelectorAll("*");
      const originalStyles: Array<{ element: HTMLElement; properties: Record<string, string> }> = [];
      
      allElements.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        const computedStyle = window.getComputedStyle(htmlEl);
        const savedProps: Record<string, string> = {};

        // Detectar e converter cor do texto
        if (computedStyle.color.includes("oklab") || computedStyle.color.includes("oklch")) {
          savedProps.color = htmlEl.style.color;
          htmlEl.style.color = "#000000";
        }

        // Detectar e converter cor de fundo
        if (computedStyle.backgroundColor.includes("oklab") || computedStyle.backgroundColor.includes("oklch")) {
          savedProps.backgroundColor = htmlEl.style.backgroundColor;
          htmlEl.style.backgroundColor = "#ffffff";
        }

        // Detectar e converter cor de borda
        if (computedStyle.borderColor.includes("oklab") || computedStyle.borderColor.includes("oklch")) {
          savedProps.borderColor = htmlEl.style.borderColor;
          htmlEl.style.borderColor = "#000000";
        }

        // Detectar e converter sombras com cores oklch
        if (computedStyle.boxShadow.includes("oklab") || computedStyle.boxShadow.includes("oklch")) {
          savedProps.boxShadow = htmlEl.style.boxShadow;
          htmlEl.style.boxShadow = "none";
        }

        if (Object.keys(savedProps).length > 0) {
          originalStyles.push({ element: htmlEl, properties: savedProps });
        }
      });

      // Renderizar com html2canvas em alta resolução
      const canvas = await html2canvas(printArea, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 15000,
        foreignObjectRendering: false,
        width: printArea.offsetWidth,
        height: printArea.offsetHeight,
      });

      // Restaurar estilos originais de cores oklch
      originalStyles.forEach(({ element, properties }) => {
        Object.entries(properties).forEach(([key, value]) => {
          if (value) {
            (element.style as any)[key] = value;
          }
        });
      });

      // Restaurar estilos originais
      printArea.style.borderRadius = originalBorderRadius;

      dateElements.forEach(({ element, originalWeight }) => {
        if (element.tagName === "P" && originalWeight.includes("<")) {
          // Restaurar HTML original para parágrafos modificados
          element.innerHTML = originalWeight;
        } else {
          element.style.fontWeight = originalWeight;
        }
      });

      // Remover CSS temporário
      const tempStyleEl = document.getElementById("certificate-static-css");
      if (tempStyleEl) {
        tempStyleEl.remove();
      }

      // Criar canvas A4 preenchendo 100% da área
      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = a4Width;
      finalCanvas.height = a4Height;
      const ctx = finalCanvas.getContext("2d");

      if (ctx) {
        // Preencher fundo branco
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, a4Width, a4Height);

        // Esticar imagem para preencher 100% do A4 (sem bordas brancas)
        ctx.drawImage(canvas, 0, 0, a4Width, a4Height);
      }

      // Criar PDF A4 landscape
      const imgData = finalCanvas.toDataURL("image/jpeg", 1.0);

      const options = {
        margin: [0, 0, 0, 0],
        filename: `Certificado_${certificate?.nome_aluno?.replace(/\s+/g, "_")}_${new Date().getTime()}.pdf`,
        image: { type: "jpeg", quality: 1.0 },
        html2canvas: { scale: 3 },
        jsPDF: {
          unit: "mm",
          format: [297, 210],
          orientation: "landscape",
          compress: false,
          precision: 16,
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      // Criar elemento temporário com a imagem
      const element = document.createElement("div");
      element.style.width = "297mm";
      element.style.height = "210mm";
      element.style.margin = "0";
      element.style.padding = "0";
      element.style.overflow = "hidden";
      element.style.position = "relative";

      const img = document.createElement("img");
      img.src = imgData;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "fill";
      img.style.display = "block";
      element.appendChild(img);

      // Gerar PDF em UMA página
      html2pdf().set(options).from(element).save();

      console.log("✅ PDF gerado com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Por favor, tente novamente.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="text-center">
          <div className="mb-4 inline-block h-16 w-16 animate-spin rounded-full border-b-4 border-blue-600"></div>
          <h2 className="mb-2 text-2xl font-bold text-gray-800">
            Gerando seu certificado...
          </h2>
          <p className="text-gray-600">Por favor, aguarde um momento</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-2xl">
          <div className="mb-6 text-center">
            <span className="mb-4 block animate-bounce text-8xl">🎓</span>
            <h2 className="mb-2 text-3xl font-bold text-gray-800">
              Parabéns pela Conclusão!
            </h2>
            <p className="text-lg text-gray-600">
              Você completou a trilha com sucesso!
            </p>
          </div>

          <div className="mb-6 rounded-lg border-4 border-double border-yellow-600 bg-gradient-to-br from-yellow-50 to-orange-50 p-6">
            <div className="text-center">
              <div className="mb-4 text-5xl">🏆</div>
              <h3 className="mb-2 text-xl font-semibold text-gray-800">
                Trilha Concluída!
              </h3>
              <p className="mb-4 text-gray-700">
                Você atingiu a nota mínima e completou 100% da trilha de
                aprendizagem.
              </p>
              <div className="rounded-lg bg-white p-4">
                <p className="mb-2 text-sm text-gray-600">
                  ℹ️ <strong>Sistema de Certificados em Desenvolvimento</strong>
                </p>
                <p className="text-xs text-gray-500">
                  O módulo de geração automática de certificados PDF está sendo
                  implementado. Em breve você poderá baixar seu certificado
                  oficial.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <button
              onClick={() => navigate(`/trail/${trailId}`)}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              ← Voltar para a Trilha
            </button>
            <button
              onClick={() => navigate("/trails")}
              className="rounded-lg bg-gray-600 px-6 py-3 font-semibold text-white transition hover:bg-gray-700"
            >
              Ver Mais Trilhas
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-4 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header de Celebração */}
        <div className="animate-fadeIn mb-8 text-center">
          <div className="mb-4 animate-bounce text-8xl">🎓</div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Parabéns!
          </h1>
          <p className="text-xl text-gray-700">
            Você conquistou seu certificado de conclusão!
          </p>
        </div>

        {/* Card do Certificado - Design Moderno e Profissional */}
        <div
          id="certificate-print-area"
          className="mb-8 overflow-hidden rounded-lg bg-white shadow-2xl"
        >
          <div className="relative">
            {/* Certificado Visual - Design Elegante FAURGS */}
            <div
              className="flex flex-col bg-gradient-to-br from-white to-gray-50"
              style={{ aspectRatio: "297/210" }}
            >
              {/* Header com Barra Azul */}
              <div className="relative h-12 bg-[#002855]">
                <div className="absolute inset-0 opacity-10">
                  <div
                    className="h-full w-full"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)",
                    }}
                  ></div>
                </div>
              </div>

              {/* Conteúdo do Certificado */}
              <div
                className="relative flex flex-1 flex-col px-14 py-10"
                data-cert-content
              >
                {/* Logo Institucional FAURG como Marca d'água */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.045]">
                  <img
                    src={FaurgLogo}
                    alt="Logo FAURG"
                    className="h-[1000px] w-auto object-contain"
                    style={{ filter: "grayscale(30%)" }}
                  />
                </div>

                {/* Borda Decorativa Preta Fina */}
                <div
                  className="absolute border border-gray-800"
                  data-cert-border="primary"
                  style={{
                    top: "20px",
                    left: "20px",
                    right: "20px",
                    bottom: "20px",
                  }}
                ></div>

                {/* Conteúdo Principal */}
                <div className="relative z-10 space-y-7">
                  {/* Título Refinado */}
                  <div className="text-center">
                    <div className="mb-2.5 flex items-center justify-center">
                      <div className="h-px w-20 bg-gradient-to-r from-transparent via-[#003D7A] to-transparent"></div>
                      <div className="mx-4 text-xs font-semibold tracking-[0.35em] text-[#003D7A]/60 uppercase">
                        Certificado
                      </div>
                      <div className="h-px w-20 bg-gradient-to-r from-transparent via-[#003D7A] to-transparent"></div>
                    </div>
                    <h1 className="font-serif text-[2.8rem] leading-tight font-bold tracking-tight text-[#1a1a1a]">
                      CERTIFICADO DE CONCLUSÃO
                    </h1>
                    <div className="mx-auto mt-2.5 h-1 w-24 bg-gradient-to-r from-transparent via-[#003D7A] to-transparent"></div>
                  </div>

                  {/* Texto de Certificação com Tipografia Refinada */}
                  <div className="mx-auto max-w-3xl space-y-4 px-4 text-center leading-relaxed font-light text-gray-800">
                    <p className="text-[1rem] leading-relaxed">
                      Certificamos que{" "}
                      <strong className="font-semibold text-[#1a1a1a]">
                        {certificate.nome_aluno}
                      </strong>{" "}
                      concluiu com êxito{" "}
                      <strong className="font-semibold text-[#1a1a1a]">
                        {trailName}
                      </strong>
                      , realizado no período de{" "}
                      {new Date(certificate.data_emissao).toLocaleDateString(
                        "pt-BR",
                      )}{" "}
                      a{" "}
                      {new Date(certificate.data_emissao).toLocaleDateString(
                        "pt-BR",
                      )}
                      , com carga horária total de{" "}
                      <strong className="font-semibold text-[#1a1a1a]">
                        {certificate.carga_horaria || 40} horas
                      </strong>
                      .
                    </p>

                    <p className="text-[0.95rem] leading-relaxed text-gray-700">
                      Esse curso teve por objetivo integrar colaboradores à
                      cultura, missão, processos e boas práticas da FAURG,
                      fortalecendo o engajamento com os princípios de excelência
                      no apoio à educação, pesquisa, inovação e desenvolvimento
                      institucional.
                    </p>
                  </div>

                  {/* Rodapé com Layout Otimizado - Assinatura à Direita */}
                  <div className="mt-auto pt-16" data-cert-signature>
                    <div className="flex items-start justify-between">
                      {/* Coluna Esquerda: Data e Local */}
                      <div className="flex-1">
                        <p className="text-sm font-light text-gray-700">
                          Rio Grande,{" "}
                          <strong className="font-medium">
                            {new Date(
                              certificate.data_emissao,
                            ).toLocaleDateString("pt-BR")}
                          </strong>
                          .
                        </p>
                      </div>

                      {/* Coluna Direita: Assinatura */}
                      <div className="flex flex-1 flex-col items-end pr-8">
                        {/* Assinatura */}
                        <div className="text-center">
                          <div className="mb-1 h-px w-56 bg-gray-800"></div>
                          <p className="text-sm font-medium tracking-wide text-gray-800 uppercase">
                            [ASSINATURA]
                          </p>
                          <p className="mt-0.5 text-xs font-light tracking-wider text-gray-600 uppercase">
                            [NOME RESPONSÁVEL]
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer com Barra Azul */}
              <div className="relative h-12 bg-[#002855]">
                <div className="absolute inset-0 opacity-10">
                  <div
                    className="h-full w-full"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ações - 3 Botões Modernos */}
        <div className="mb-6 overflow-hidden rounded-lg bg-white shadow-lg">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={generatePDF}
                className="group flex transform items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 font-medium text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:from-green-700 hover:to-green-800 hover:shadow-lg active:scale-[0.98]"
              >
                <svg
                  className="h-5 w-5 transition-transform group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                <span>Salvar PDF</span>
              </button>

              <button
                onClick={() => window.print()}
                className="group flex transform items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-medium text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:from-blue-700 hover:to-blue-800 hover:shadow-lg active:scale-[0.98]"
              >
                <svg
                  className="h-5 w-5 transition-transform group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                <span>Imprimir</span>
              </button>

              <button
                onClick={() => navigate(isAdmin ? "/admin" : "/meu-aprendizado")}
                className="group flex transform items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-3 font-medium text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:from-gray-700 hover:to-gray-800 hover:shadow-lg active:scale-[0.98]"
              >
                <svg
                  className="h-5 w-5 transition-transform group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isAdmin ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  )}
                </svg>
                <span>{isAdmin ? "Voltar ao Painel" : "Meus Certificados"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Informações Adicionais - Design Refinado */}
        <div className="mb-6 overflow-hidden rounded-lg bg-white shadow-md">
          <div className="border-l-4 border-blue-600 bg-gradient-to-r from-blue-50/50 to-transparent p-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
              <svg
                className="h-5 w-5 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Sobre este certificado</span>
            </h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Este certificado é válido e pode ser verificado usando o
                  código acima
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Você pode compartilhar este certificado em seu perfil
                  profissional
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  O PDF do certificado está disponível para download a qualquer
                  momento
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  Acesse seus certificados através do menu "Meu Aprendizado"
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Botão de Voltar */}
        <div className="text-center">
          <button
            onClick={() => navigate("/trails")}
            className="text-gray-600 underline transition hover:text-gray-800"
          >
            ← Voltar para o Catálogo de Trilhas
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateGenerator;
