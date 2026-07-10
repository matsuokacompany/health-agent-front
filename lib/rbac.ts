import type { RoleName, User } from './types';

export const roleHome: Record<RoleName, string> = {
  patient: '/patient',
  professional: '/professional',
  admin: '/login',
  super_admin: '/choose-context',
};

export function hasRole(user: User | null | undefined, role: RoleName) {
  return user?.roles.includes(role) === true;
}

export function isSuperAdmin(user: User | null | undefined) {
  return hasRole(user, 'super_admin');
}

export function isAdmin(user: User | null | undefined) {
  return isSuperAdmin(user);
}

export function isProfessional(user: User | null | undefined) {
  return hasRole(user, 'professional');
}

export function isPatient(user: User | null | undefined) {
  return hasRole(user, 'patient');
}

export function hasActiveConsent(user?: User | null) {
  return Boolean(user?.consent?.accepted_at && !user.consent.revoked_at);
}

export function canAccessRoute(user: User | null | undefined, path: string) {
  if (!user) return path.startsWith('/login');
  if (path.startsWith('/choose-context')) return isSuperAdmin(user);
  if (path.startsWith('/admin')) return isSuperAdmin(user);
  if (path.startsWith('/patient')) return isSuperAdmin(user) || isPatient(user);
  if (path.startsWith('/professional')) return isSuperAdmin(user) || isProfessional(user);
  if (path.startsWith('/app')) return false;
  return true;
}

export function canAccessPatient(requester: User, patientId: number | string) {
  if (isSuperAdmin(requester)) return true;
  if (isPatient(requester) && String(requester.id) === String(patientId)) return true;
  return requester.linkedPatientIds?.map(String).includes(String(patientId)) === true;
}

export function assertCanAccessPatient(requester: User, patientId: number | string) {
  if (!canAccessPatient(requester, patientId)) throw new Error('forbidden');
}

export function assertSuperAdmin(requester: User) {
  if (!isSuperAdmin(requester)) throw new Error('forbidden');
}

export function sanitizeClinicalText(input: string) {
  return input.replace(/[\w.-]+@[\w.-]+/g, '[email]').replace(/\+?\d[\d\s().-]{7,}\d/g, '[phone]').replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[cpf]').slice(0, 2000).trim();
}
