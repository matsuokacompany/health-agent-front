import { describe, expect, it } from 'vitest';
import { roleHome } from '@/lib/rbac';

describe('role navigation', () => {
  it('routes patient and professional roles to their context roots', () => {
    expect(roleHome.patient).toBe('/patient');
    expect(roleHome.professional).toBe('/professional');
  });

  it('routes super_admin to context selection instead of a direct workspace', () => {
    expect(roleHome.super_admin).toBe('/choose-context');
  });
});
