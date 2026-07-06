import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { professionalApi, type ProfessionalCheckInsParams, type ProfessionalCheckIn, type ProfessionalDashboard, type ProfessionalPaginatedResponse, type ProfessionalPatient } from '@/services/professional';
import type { Anamnese } from '@/lib/types';

export function useProfessionalPatients() {
  return useQuery<ProfessionalPatient[]>({ queryKey: ['professional', 'patients'], queryFn: professionalApi.listPatients, staleTime: 60_000 });
}

export function useProfessionalDashboard(patientId: string) {
  return useQuery<ProfessionalDashboard>({ queryKey: ['professional', 'patients', patientId, 'dashboard'], queryFn: () => professionalApi.getDashboard(patientId), enabled: Boolean(patientId), staleTime: 60_000 });
}

export function useProfessionalCheckIns(patientId: string, params: ProfessionalCheckInsParams) {
  return useQuery<ProfessionalPaginatedResponse<ProfessionalCheckIn>>({ queryKey: ['professional', 'patients', patientId, 'checkins', params], queryFn: () => professionalApi.getCheckIns(patientId, params), enabled: Boolean(patientId), placeholderData: keepPreviousData, staleTime: 30_000 });
}

export function useProfessionalAnamnese(patientId: string) {
  return useQuery<Anamnese>({ queryKey: ['professional', 'patients', patientId, 'anamnese'], queryFn: () => professionalApi.getAnamnese(patientId), enabled: Boolean(patientId), staleTime: 120_000 });
}

export function generateProfessionalAiReport(patientId: string, payload: Parameters<typeof professionalApi.generateAiReport>[1]) {
  return professionalApi.generateAiReport(patientId, payload);
}
