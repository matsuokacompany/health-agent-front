import { describe, expect, it } from 'vitest';
import { canAccessPatient, canAccessRoute, isAdmin, isPatient, isProfessional, isSuperAdmin, sanitizeClinicalText } from '@/lib/rbac';
import { mockUsers } from '@/lib/mockData';
import type { RoleName } from '@/lib/types';

const patient = mockUsers[0], pro = mockUsers[1], superAdmin = mockUsers[2];

describe('rbac', () => {
  it('isolates patients by local user id', () => {
    expect(canAccessPatient(patient, 1)).toBe(true);
    expect(canAccessPatient(patient, 4)).toBe(false);
  });

  it('limits professional to linked local patient ids', () => {
    expect(canAccessPatient(pro, 1)).toBe(true);
    expect(canAccessPatient(pro, 4)).toBe(false);
  });

  it('allows super_admin/admin controlled global access', () => {
    expect(isSuperAdmin(superAdmin)).toBe(true);
    expect(isAdmin(superAdmin)).toBe(true);
    expect(canAccessPatient(superAdmin, 4)).toBe(true);
  });

  it('supports users with multiple roles', () => {
    const hybrid = { ...patient, roles: ['patient', 'professional'] as RoleName[] };
    expect(isPatient(hybrid)).toBe(true);
    expect(isProfessional(hybrid)).toBe(true);
  });

  it('protects role routes', () => {
    expect(canAccessRoute(patient, '/patient/dashboard')).toBe(true);
    expect(canAccessRoute(patient, '/admin')).toBe(false);
    expect(canAccessRoute(superAdmin, '/admin/users/1/roles')).toBe(true);
  });

  it('redacts direct identifiers from clinical text', () => {
    expect(sanitizeClinicalText('cpf 123.456.789-10 tel +55 11 99999-9999 a@b.com')).not.toMatch(/123|99999|a@b/);
  });
});
