import { mockPatients, mockUsers } from '@/lib/mockData';
import type { PatientProfile, User } from '@/lib/types';
import { canAccessPatient } from '@/lib/rbac';
import { USE_MOCK, api } from './api';
import { audit } from './audit';

export async function listPatients(requester: User) {
  if (!['professional', 'admin'].includes(requester.role)) return [];
  audit(requester.id, 'patients.list', 'patients');
  if (USE_MOCK) return mockPatients.filter((patient) => canAccessPatient(requester, patient.id));
  return api<PatientProfile[]>('/patients');
}

export async function getPatient(requester: User, patientId: string) {
  if (!canAccessPatient(requester, patientId)) throw new Error('forbidden');
  audit(requester.id, 'patient.read', `patient:${patientId}`);
  if (USE_MOCK) return mockPatients.find((patient) => patient.id === patientId) ?? mockUsers.find((user) => user.id === patientId && user.role === 'patient') ?? null;
  return api<PatientProfile>(`/patients/${patientId}`);
}
