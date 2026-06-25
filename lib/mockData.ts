import type { Anamnese, DailyReport, PatientProfile, User } from './types';

const now = '2026-06-01T10:00:00Z';

export const mockUsers: User[] = [
  { id: 1, role: 'patient', roles: ['patient'], email: 'ana@example.com', name: 'Ana Paciente', supabase_user_id: '00000000-0000-0000-0000-000000000001', created_at: now, updated_at: now, consent: { user_id: '1', accepted_at: now, version: '2026-01' } },
  { id: 2, role: 'professional', roles: ['professional'], email: 'dr@example.com', name: 'Dra. Silva', supabase_user_id: '00000000-0000-0000-0000-000000000002', linkedPatientIds: [1], created_at: now, updated_at: now, consent: { user_id: '2', accepted_at: now, version: '2026-01' } },
  { id: 3, role: 'super_admin', roles: ['super_admin', 'admin'], email: 'admin@example.com', name: 'Admin', supabase_user_id: '00000000-0000-0000-0000-000000000003', created_at: now, updated_at: now, consent: { user_id: '3', accepted_at: now, version: '2026-01' } },
  { id: 4, role: 'patient', roles: ['patient'], email: 'carlos@example.com', name: 'Carlos Lima', supabase_user_id: '00000000-0000-0000-0000-000000000004', created_at: now, updated_at: now, consent: { user_id: '4', accepted_at: now, version: '2026-01' } },
];

const patientById = (id: number) => mockUsers.find((user) => user.id === id && user.roles.includes('patient')) as User;

export const mockPatients: PatientProfile[] = [
  { ...patientById(1), age: 34, diagnosis: 'Monitoramento pós-operatório', lastCheckIn: '2026-06-19', riskLevel: 'moderado' },
  { ...patientById(4), age: 58, diagnosis: 'Controle cardiometabólico', lastCheckIn: '2026-06-18', riskLevel: 'alto' },
];

export const mockReports: DailyReport[] = [
  { id: 'r1', user_id: 1, report_date: '2026-06-16', check_type: 'daily', symptom_description: 'Sem sintomas relevantes', had_symptoms: false, completed: true, painLevel: 0, riskFlags: [] },
  { id: 'r2', user_id: 1, report_date: '2026-06-17', check_type: 'daily', symptom_description: 'Dor de cabeça leve', had_symptoms: true, completed: true, painLevel: 2, riskFlags: [] },
  { id: 'r3', user_id: 1, report_date: '2026-06-18', check_type: 'risk', symptom_description: 'Febre baixa e fadiga', had_symptoms: true, completed: true, painLevel: 4, riskFlags: ['febre'] },
  { id: 'r4', user_id: 4, report_date: '2026-06-18', check_type: 'risk', symptom_description: 'Falta de ar ao esforço', had_symptoms: true, completed: true, painLevel: 6, riskFlags: ['dispneia', 'risco cardiovascular'] },
];

export const mockAnamnese: Anamnese[] = [
  { id: 'a1', user_id: 1, info: 'Histórico resumido e minimizado para interface clínica.' },
  { id: 'a2', user_id: 4, info: 'Paciente em acompanhamento de rotina com fatores de risco controlados.' },
];
