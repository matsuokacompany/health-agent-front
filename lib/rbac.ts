import type { Role, User } from './types';

export const roleHome: Record<Role, string> = { patient: '/patient/dashboard', professional: '/professional/patients', admin: '/professional/patients' };
export function hasActiveConsent(user?: User | null) { return Boolean(user?.consent?.accepted_at && !user.consent.revoked_at); }
export function canAccessRoute(user: User | null | undefined, path: string) {
  if (!user) return path.startsWith('/login');
  if (!hasActiveConsent(user)) return path === '/login' || path === '/consent';
  if (user.role === 'admin') return true;
  if (path.startsWith('/patient')) return user.role === 'patient';
  if (path.startsWith('/professional')) return user.role === 'professional';
  return true;
}
export function canAccessPatient(requester: User, patientId: string) {
  if (requester.role === 'admin') return true;
  if (requester.role === 'patient') return requester.id === patientId;
  return requester.linkedPatientIds?.includes(patientId) === true;
}
export function sanitizeClinicalText(input: string) {
  return input.replace(/[\w.-]+@[\w.-]+/g, '[email]').replace(/\+?\d[\d\s().-]{7,}\d/g, '[phone]').replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[cpf]').slice(0, 2000).trim();
}
