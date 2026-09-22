import type { PatientHandoffSummary } from '@/lib/types';
import { api } from './api';

function withDates(path: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export const patientHandoffApi = {
  me: (startDate?: string, endDate?: string) =>
    api<PatientHandoffSummary>(withDates('/api/patient-handoff/me', startDate, endDate)),
  forPatient: (patientId: number, startDate?: string, endDate?: string) =>
    api<PatientHandoffSummary>(withDates(`/api/patient-handoff/patients/${patientId}`, startDate, endDate)),
};
