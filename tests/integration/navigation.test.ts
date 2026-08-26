import { describe, expect, it } from 'vitest';
import { roleHome } from '@/lib/rbac';

describe('role navigation', () => {
  it('routes patient and professional roles to their context roots', () => {
    expect(roleHome.patient).toBe('/patient');
    expect(roleHome.professional).toBe('/professional');
  });

  it('routes super_admin straight to the administration platform', () => {
    expect(roleHome.super_admin).toBe('/admin');
  });
});
