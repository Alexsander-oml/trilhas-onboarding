import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { certificateService } from '../services/certificates.service';

describe('Certificate System', () => {
  const testUserId = 1;
  const testTrailId = 42;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should issue a certificate successfully', () => {
    const result = certificateService.issueCertificate(
      testUserId,
      testTrailId,
      'JavaScript Avançado',
      'João Silva',
      new Date(Date.now() - 30*24*60*60*1000).toISOString(),
      new Date().toISOString(),
      40
    );

    expect(result).toBeDefined();
    expect(result.status).toBe('visual');
    expect(result.studentName).toBe('João Silva');
  });

  it('should retrieve user certificates', () => {
    certificateService.issueCertificate(
      testUserId,
      testTrailId,
      'Trail 1',
      'João Silva',
      new Date().toISOString(),
      new Date().toISOString(),
      40
    );

    const certificates = certificateService.getUserCertificates(testUserId);
    expect(certificates.length).toBeGreaterThan(0);
    expect(certificates[0].trailId).toBe(testTrailId);
  });

  it('should format dates correctly', () => {
    const date = new Date('2026-01-19');
    const formatted = certificateService.formatDate(date.toISOString());
    expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('should detect trail completion', () => {
    expect(certificateService.isTrailComplete(100)).toBe(true);
    expect(certificateService.isTrailComplete(99)).toBe(false);
    expect(certificateService.isTrailComplete(50)).toBe(false);
  });

  it('should persist certificates in localStorage', () => {
    certificateService.issueCertificate(
      testUserId,
      testTrailId,
      'Trail Test',
      'Test User',
      new Date().toISOString(),
      new Date().toISOString(),
      40
    );

    const stored = localStorage.getItem(`certificate_${testUserId}_${testTrailId}`);
    expect(stored).toBeDefined();
    
    const parsed = JSON.parse(stored!);
    expect(parsed.trailName).toBe('Trail Test');
  });
});
