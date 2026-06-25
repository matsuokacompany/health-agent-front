import { describe, expect, it } from 'vitest';
import { canAccessPatient, canAccessRoute, isAdmin, isPatient, isProfessional, isSuperAdmin, sanitizeClinicalText } from '@/lib/rbac';
import type { RoleName } from '@/lib/types';
import { patientUser, professionalUser, superAdminUser } from '../fixtures/users';

describe('rbac', () => {
  it('isolates patients by local user id', () => {
    expect(canAccessPatient(patientUser, 1)).toBe(true);
    expect(canAccessPatient(patientUser, 4)).toBe(false);
  });

  it('limits professional to linked local patient ids', () => {
    expect(canAccessPatient(professionalUser, 1)).toBe(true);
    expect(canAccessPatient(professionalUser, 4)).toBe(false);
  });

  it('allows super_admin/admin controlled global access', () => {
    expect(isSuperAdmin(superAdminUser)).toBe(true);
    expect(isAdmin(superAdminUser)).toBe(true);
    expect(canAccessPatient(superAdminUser, 4)).toBe(true);
  });

  it('supports users with multiple roles', () => {
    const hybrid = { ...patientUser, roles: ['patient', 'professional'] as RoleName[] };
    expect(isPatient(hybrid)).toBe(true);
    expect(isProfessional(hybrid)).toBe(true);
  });

  it('protects role routes', () => {
    expect(canAccessRoute(patientUser, '/patient/dashboard')).toBe(true);
    expect(canAccessRoute(patientUser, '/admin')).toBe(false);
    expect(canAccessRoute(superAdminUser, '/admin/users/1/roles')).toBe(true);
  });

  it('redacts direct identifiers from clinical text', () => {
    expect(sanitizeClinicalText('cpf 123.456.789-10 tel +55 11 99999-9999 a@b.com')).not.toMatch(/123|99999|a@b/);
  });
});
