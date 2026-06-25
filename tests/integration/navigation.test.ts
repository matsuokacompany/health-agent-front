import { describe, expect, it } from 'vitest';
import { roleHome } from '@/lib/rbac';

describe('role navigation', () => {
  it('routes patient role to patient home', () => {
    expect(roleHome.patient).toBe('/patient/dashboard');
  });

  it('routes admin and super_admin to admin home', () => {
    expect(roleHome.admin).toBe('/admin');
    expect(roleHome.super_admin).toBe('/admin');
  });
});
