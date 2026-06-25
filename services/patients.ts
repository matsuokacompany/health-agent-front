import type { PatientProfile, User } from '@/lib/types';
import { canAccessPatient, isAdmin, isProfessional } from '@/lib/rbac';
import { api } from './api';
import { audit } from './audit';

export async function listPatients(requester: User): Promise<PatientProfile[]> {
  if (!isProfessional(requester) && !isAdmin(requester)) return [];
  audit(requester.id, 'patients.list', 'patients');
  return api<PatientProfile[]>('/api/users/');
}

export async function getPatient(requester: User, patientId: number): Promise<PatientProfile | null> {
  if (!canAccessPatient(requester, patientId)) throw new Error('forbidden');
  audit(requester.id, 'patient.read', `patient:${patientId}`);
  return api<PatientProfile>(`/api/users/${patientId}`);
}
