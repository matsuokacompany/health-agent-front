import { mockPatients, mockUsers } from '@/lib/mockData';
import type { PatientProfile, User } from '@/lib/types';
import { canAccessPatient } from '@/lib/rbac';
import { USE_MOCK, apiClient } from './api';
import { audit } from './audit';

export async function listPatients(requester: User): Promise<PatientProfile[]> {
  if (!['professional', 'admin'].includes(requester.role)) return [];
  audit(requester.id, 'patients.list', 'patients');
  if (USE_MOCK) return mockPatients.filter((patient) => canAccessPatient(requester, patient.id));
  return apiClient.request<PatientProfile[]>('/patients');
}

export async function getPatient(requester: User, patientId: string): Promise<PatientProfile | null> {
  if (!canAccessPatient(requester, patientId)) throw new Error('forbidden');

  audit(requester.id, 'patient.read', `patient:${patientId}`);

  if (USE_MOCK) {
    const patient = mockPatients.find((p) => p.id === patientId);

    if (patient) return patient;

    // fallback opcional (MAS convertido para PatientProfile)
    const user = mockUsers.find(
      (u) => u.id === patientId && u.role === 'patient'
    );

    if (user) {
      return {
        ...user,
        age: 0,
        diagnosis: 'Não informado',
        lastCheckIn: 'Não informado',
        riskLevel: 'baixo',
      };
    }

    return null;
  }

  return apiClient.request<PatientProfile>(`/patients/${patientId}`);
}