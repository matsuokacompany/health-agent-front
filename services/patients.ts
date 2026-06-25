import { mockPatients } from '@/lib/mockData';
import type { PatientProfile, User } from '@/lib/types';
import { canAccessPatient } from '@/lib/rbac';
import { USE_MOCK, api } from './api';
import { audit } from './audit';

export async function listPatients(requester: User): Promise<PatientProfile[]> {
  if (!['professional', 'admin'].includes(requester.role)) return [];
  audit(requester.id, 'patients.list', 'patients');
  if (USE_MOCK) return mockPatients.filter((patient) => canAccessPatient(requester, patient.id));
  return api<PatientProfile[]>('/patients');
}

export async function getPatient(requester: User, patientId: string): Promise<PatientProfile | null> {
  if (!canAccessPatient(requester, patientId)) throw new Error('forbidden');

  audit(requester.id, 'patient.read', `patient:${patientId}`);

  if (USE_MOCK) {
    const patient = mockPatients.find((p) => p.id === patientId);

    if (patient) return patient;

    return null;
  }

  return api<PatientProfile>(`/patients/${patientId}`);
}