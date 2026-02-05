/**
 * CertificatePreview Component
 *
 * Modal que exibe o certificado do usuário.
 * Usa o CertificateTemplate para garantir consistência visual.
 */

import React from "react";
import html2canvas from "html2canvas";
import type { Certificate } from "../types/certificate";
import CertificateTemplate from "./CertificateTemplate";

interface CertificatePreviewProps {
  certificate: Certificate;
  onClose?: () => void;
  showPrintButton?: boolean;
}

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({
  certificate,
  onClose,
  showPrintButton = true,
}) => {
  const handlePrint = () => {
    window.print();
  };

  /**
   * Aguarda o carregamento de TODAS as imagens em um elemento
   * Essencial para PDF em produção (Docker/Nginx)
   */
  const waitForAllImages = (element: HTMLElement): Promise<void> => {
    return new Promise((resolve) => {
      const images = element.querySelectorAll("img");

      if (images.length === 0) {
        resolve();
        return;
      }

      let loadedCount = 0;
      const total = images.length;

      images.forEach((img) => {
        if (img.complete) {
          loadedCount++;
          if (loadedCount === total) resolve();
        } else {
          img.onload = () => {
            loadedCount++;
            if (loadedCount === total) resolve();
          };
          img.onerror = () => {
            loadedCount++;
            if (loadedCount === total) resolve();
          };
        }
      });

      // Timeout de segurança
      setTimeout(resolve, 5000);
    });
  };

  /**
   * Prepara o certificado para PDF removendo elementos problemáticos
   * CULPADO IDENTIFICADO: SVG (FaurgLogo) sem width/height causava canvas 0x0
   */
  const prepareCertificateForPDF = (element: HTMLElement): HTMLElement => {
    const clone = element.cloneNode(true) as HTMLElement;

    // 1. Remover TODAS as tags <img> - incluindo a logo FAURG
    // Motivo: SVG importado sem width/height explícitos causa html2canvas criar canvas com dimensões 0x0
    const images = clone.querySelectorAll("img");
    console.log(`🗑️ Removendo ${images.length} imagens do clone`);
    images.forEach((img) => {
      console.log(`  - ${img.alt || img.src.substring(0, 30)}`);
      img.remove();
    });

    // 2. Remover <svg> inline
    const svgs = clone.querySelectorAll("svg");
    console.log(`🗑️ Removendo ${svgs.length} SVGs do clone`);
    svgs.forEach((svg) => svg.remove());

    // 3. Remover todos os background-image de style inline
    // Motivo: Podem ser URLs problemáticas que não carregam via Nginx
    const elementsWithStyle = clone.querySelectorAll("[style*='background']");
    console.log(`🎨 Limpando background de ${elementsWithStyle.length} elementos`);
    elementsWithStyle.forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.backgroundImage = "none";
      htmlEl.style.background = htmlEl.style.background.replace(/url\([^)]*\)/g, "");
    });

    // 4. Remover classes Tailwind com background (bg-*, opacity-*)
    // Motivo: Podem gerar pseudo-elementos problemáticos via CSS
    const allElements = clone.querySelectorAll("*");
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl.className && typeof htmlEl.className === "string") {
        const classes = htmlEl.className.split(" ");
        const filtered = classes.filter(
          (c) =>
            !c.includes("bg-") &&
            !c.includes("opacity-") &&
            !c.includes("gradient") &&
            !c.includes("pattern")
        );
        htmlEl.className = filtered.join(" ");
      }
    });

    // 5. Forçar dimensões fixas do container A4 landscape
    // Motivo: Garante que html2canvas tenha dimensões válidas
    clone.style.width = "297mm";
    clone.style.height = "210mm";
    clone.style.aspectRatio = "297/210";
    clone.style.margin = "0";
    clone.style.padding = "0";
    clone.style.overflow = "visible";

    return clone;
  };

  /**
   * Remove backgrounds com URL (inclui data:image/svg+xml) no clone já anexado ao DOM
   * Mantém gradientes para preservar fidelidade visual
   */
  const stripProblematicBackgrounds = (root: HTMLElement) => {
    const removed: Array<{ tag: string; className: string; bg: string }> = [];
    const elements = root.querySelectorAll("*");

    elements.forEach((el) => {
      const style = window.getComputedStyle(el);
      const bgImage = style.backgroundImage;

      if (bgImage && bgImage !== "none" && bgImage.includes("url(")) {
        const htmlEl = el as HTMLElement;
        htmlEl.style.backgroundImage = "none";
        removed.push({
          tag: el.tagName,
          className: htmlEl.className || "",
          bg: bgImage,
        });
      }
    });

    if (removed.length > 0) {
      console.warn("⚠️ Backgrounds com URL removidos:", removed);
    }
  };

  const generatePDF = async () => {
    const printArea = document.getElementById("certificate-print-area");
    if (!printArea) {
      alert("Erro: Elemento do certificado não encontrado");
      return;
    }

    try {
      console.log("🎓 Iniciando geração de PDF do certificado...");

      // Aguardar fontes carregarem
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      // Aguardar TODAS as imagens carregarem (crítico em Docker/Nginx)
      console.log("⏳ Aguardando carregamento de imagens...");
      await waitForAllImages(printArea);

      console.log("✅ Todas as imagens carregadas");

      // Aguardar renderização completa
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Preparar certificado removendo elementos problemáticos
      console.log("🧹 Preparando certificado para PDF...");
      const clonedPrintArea = prepareCertificateForPDF(printArea);

      // Adicionar temporariamente ao DOM para que html2canvas consiga renderizar
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "-9999px";
      tempContainer.style.width = "297mm";
      tempContainer.style.height = "210mm";
      tempContainer.appendChild(clonedPrintArea);
      document.body.appendChild(tempContainer);

      // Remover pseudo-elementos e backgrounds com URL após anexar ao DOM
      const styleOverride = document.createElement("style");
      styleOverride.textContent = `
        #certificate-print-area *::before,
        #certificate-print-area *::after {
          background-image: none !important;
          content: none !important;
        }
      `;
      tempContainer.appendChild(styleOverride);

      stripProblematicBackgrounds(clonedPrintArea);

      console.log("📸 Capturando com html2canvas...");

      // Capturar para canvas
      // allowTaint: false = não renderiza conteúdo CORS problemático
      // scale: 2 = qualidade suficiente para impressão
      const canvas = await html2canvas(clonedPrintArea, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 5000,
        foreignObjectRendering: false,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (el) => {
          const style = window.getComputedStyle(el as Element);
          const bgImage = style.backgroundImage || "";
          return bgImage.includes("url(");
        },
      });

      // Remover container temporário
      document.body.removeChild(tempContainer);

      console.log("✅ Canvas gerado com sucesso:", {
        width: canvas.width,
        height: canvas.height,
      });

      // Validar canvas
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error("❌ Canvas com dimensões inválidas (0x0)");
      }

      // Converter para imagem
      const imgData = canvas.toDataURL("image/png");
      if (!imgData || imgData === "data:," || imgData.length < 100) {
        throw new Error("❌ Falha ao gerar imagem do canvas");
      }

      console.log(`📦 Imagem gerada: ${(imgData.length / 1024).toFixed(2)} KB`);

      // Importar jsPDF e gerar PDF
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      pdf.addImage(imgData, "PNG", 0, 0, 297, 210);

      // Salvar arquivo
      const studentName =
        certificate.studentName || certificate.nome_aluno || "certificado";
      const fileName = `Certificado_${studentName.replace(/\s+/g, "_")}_${new Date()
        .toLocaleDateString("pt-BR")
        .replace(/\//g, "-")}.pdf`;

      pdf.save(fileName);

      console.log(`✅ PDF gerado e salvo: ${fileName}`);
    } catch (error) {
      console.error("❌ Erro ao gerar PDF:", error);
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      alert(`Erro ao gerar PDF:\n${message}`);
    }
  };

  return (
    <div className="certificate-preview-container bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black p-4">
      <div className="my-4 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-2xl">
        {/* Barra de Ação */}
        <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
            📜 Certificado
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 rounded bg-green-600 px-3 py-2 text-xs text-white transition-all hover:bg-green-700 sm:px-4 sm:text-sm"
            >
              ⬇️ Baixar PDF
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded bg-gray-300 px-3 py-2 text-xs text-gray-700 transition-all hover:bg-gray-400 sm:px-4 sm:text-sm"
              >
                ✕ Fechar
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo do Certificado - Scrollável */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <CertificateTemplate
                certificate={certificate}
                trailName={certificate.trailName || "Trilha de Aprendizagem"}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Estilos de Impressão */}
      <style>{`
        @media print {
          /* Resetar body */
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
          }
          
          /* Esconder tudo exceto o certificado */
          body > *:not(#root) {
            display: none !important;
          }
          
          #root > *:not(.certificate-preview-container) {
            display: none !important;
          }
          
          /* Esconder modal overlay e botões */
          .bg-black,
          .bg-opacity-50,
          button,
          h2:contains("📜 Certificado") {
            display: none !important;
          }
          
          /* Container do modal */
          .certificate-preview-container {
            position: static !important;
            display: block !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }
          
          .certificate-preview-container > div {
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          /* Esconder barra de ação */
          .certificate-preview-container > div > div:first-child {
            display: none !important;
          }
          
          /* Área do certificado */
          .certificate-preview-container .flex-1.overflow-y-auto {
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            flex: none !important;
          }
          
          /* Posicionar o certificado para preencher a página */
          #certificate-print-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: avoid !important;
            transform: none !important;
          }
          
          /* Garantir que as cores sejam impressas */
          #certificate-print-area,
          #certificate-print-area * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          @page {
            margin: 0;
            size: A4 landscape;
          }
        }
      `}</style>
    </div>
  );
};

export default CertificatePreview;

