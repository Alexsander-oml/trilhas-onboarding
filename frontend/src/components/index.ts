/**
 * Index de Exportações - Sistema de Certificação
 * 
 * Arquivo central para facilitar imports dos componentes e hooks
 * Importe deste arquivo em vez de importar de caminhos individuais
 */

// ============================================================================
// Tipos
// ============================================================================
export type {
  Certificate,
  CertificatePayload,
  CertificateResponse,
} from '../types/certificate';

// ============================================================================
// Services
// ============================================================================
export { default as certificateService } from '../services/certificates.service';

// ============================================================================
// Hooks
// ============================================================================
export { useCertificates } from '../hooks/useCertificates';

// ============================================================================
// Componentes
// ============================================================================
export { CertificatePreview } from './CertificatePreview';
export { CertificateModal } from './CertificateModal';
export { TrailCompletionCertificate } from './TrailCompletionCertificate';

// ============================================================================
// Exemplos (opcional)
// ============================================================================
export {
  TrailDetailWithCertificate,
  MyCertificates,
  CertificateAvailableBadge,
} from './examples/CertificateIntegrationExample';

/**
 * COMO USAR:
 * 
 * Em vez de:
 *   import { Certificate } from '../types/certificate';
 *   import certificateService from '../services/certificates.service';
 *   import { useCertificates } from '../hooks/useCertificates';
 *   import { CertificatePreview } from '../components/CertificatePreview';
 * 
 * Use:
 *   import {
 *     Certificate,
 *     certificateService,
 *     useCertificates,
 *     CertificatePreview,
 *   } from '../components/index';
 * 
 * OU para componentes especificamente:
 *   import {
 *     CertificatePreview,
 *     CertificateModal,
 *     TrailCompletionCertificate,
 *   } from '../components/index';
 */
