<<<<<<< HEAD
=======
import { mockPatients } from '@/lib/mockData';
>>>>>>> dda01fb (Decouple auth and API infrastructure)
import type { PatientProfile, User } from '@/lib/types';
import { canAccessPatient, isAdmin, isProfessional } from '@/lib/rbac';
import { api } from './api';
import { audit } from './audit';

export async function listPatients(requester: User): Promise<PatientProfile[]> {
<<<<<<< HEAD
  if (!isProfessional(requester) && !isAdmin(requester)) return [];
=======
  if (!['professional', 'admin'].includes(requester.role)) return [];
>>>>>>> dda01fb (Decouple auth and API infrastructure)
  audit(requester.id, 'patients.list', 'patients');
  return api<PatientProfile[]>('/api/users/');
}

<<<<<<< HEAD
export async function getPatient(requester: User, patientId: number): Promise<PatientProfile | null> {
=======
export async function getPatient(requester: User, patientId: string): Promise<PatientProfile | null> {
>>>>>>> dda01fb (Decouple auth and API infrastructure)
  if (!canAccessPatient(requester, patientId)) throw new Error('forbidden');
  audit(requester.id, 'patient.read', `patient:${patientId}`);
<<<<<<< HEAD
  return api<PatientProfile>(`/api/users/${patientId}`);
}
=======

  if (USE_MOCK) {
    const patient = mockPatients.find((p) => p.id === patientId);

    if (patient) return patient;

    return null;
  }

  return api<PatientProfile>(`/patients/${patientId}`);
}
>>>>>>> dda01fb (Decouple auth and API infrastructure)
