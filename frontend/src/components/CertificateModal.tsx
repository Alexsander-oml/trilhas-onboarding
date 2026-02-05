/**
 * CertificateModal Component
 *
 * Modal que exibe o certificado após conclusão de uma trilha
 * Integra o CertificatePreview com lógica de conclusão
 */

import React, { useState, useEffect } from "react";
import CertificatePreview from "./CertificatePreview";
import { Certificate } from "../types/certificate";
import certificateService from "../services/certificates.service";

interface CertificateModalProps {
  isOpen: boolean;
  certificate: Certificate | null;
  onClose: () => void;
  onConfirm?: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  certificate,
  onClose,
  onConfirm,
}) => {
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen && certificate) {
      // Delay para animação
      setTimeout(() => setShowPreview(true), 100);
    } else {
      setShowPreview(false);
    }
  }, [isOpen, certificate]);

  if (!isOpen || !certificate) {
    return null;
  }

  return (
    <>
      {showPreview && (
        <CertificatePreview
          certificate={certificate}
          onClose={() => {
            setShowPreview(false);
            if (onConfirm) onConfirm();
            onClose();
          }}
          showPrintButton={true}
        />
      )}
    </>
  );
};

export default CertificateModal;
