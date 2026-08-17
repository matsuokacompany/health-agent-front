import { describe, expect, it } from 'vitest';
import { hasNonPrintableControls, normalizeUserText, validateUserText } from '@/lib/clinicalInput';
import { safeImageUrl } from '@/lib/safeUrl';

describe('clinical input boundaries', () => {
  it('preserves markup as text while removing NUL', () => {
    expect(normalizeUserText('<script>alert(1)</script>\0')).toBe('<script>alert(1)</script>');
  });

  it('rejects non-printable controls and values over the backend limit', () => {
    expect(hasNonPrintableControls('clinical\u0007text')).toBe(true);
    expect(validateUserText('1234', 3)).toContain('3 caracteres');
  });

  it('rejects user-controlled image protocols and external origins', () => {
    expect(safeImageUrl('javascript:alert(1)', 'https://julha.test')).toBeNull();
    expect(safeImageUrl('https://tracker.test/pixel', 'https://julha.test')).toBeNull();
    expect(safeImageUrl('/avatars/doctor.png', 'https://julha.test')).toBe('/avatars/doctor.png');
  });
});
