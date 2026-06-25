import type { Anamnese, DailyReport, PatientProfile, User } from './types';

export const mockUsers: User[] = [
  { id: 'p1', role: 'patient', email: 'ana@example.com', name: 'Ana Paciente', consent: { user_id: 'p1', accepted_at: '2026-06-01T10:00:00Z', version: '2026-01' } },
  { id: 'pro1', role: 'professional', email: 'dr@example.com', name: 'Dra. Silva', linkedPatientIds: ['p1'], consent: { user_id: 'pro1', accepted_at: '2026-06-01T10:00:00Z', version: '2026-01' } },
  { id: 'admin1', role: 'admin', email: 'admin@example.com', name: 'Admin', consent: { user_id: 'admin1', accepted_at: '2026-06-01T10:00:00Z', version: '2026-01' } },
  { id: 'p2', role: 'patient', email: 'carlos@example.com', name: 'Carlos Lima', consent: { user_id: 'p2', accepted_at: '2026-06-03T10:00:00Z', version: '2026-01' } },
];

const patientById = (id: string) => mockUsers.find((user) => user.id === id && user.role === 'patient') as User;

export const mockPatients: PatientProfile[] = [
  { ...patientById('p1'), age: 34, diagnosis: 'Monitoramento pós-operatório', lastCheckIn: '2026-06-19', riskLevel: 'moderado' },
  { ...patientById('p2'), age: 58, diagnosis: 'Controle cardiometabólico', lastCheckIn: '2026-06-18', riskLevel: 'alto' },
];

export const mockReports: DailyReport[] = [
  { id: 'r1', user_id: 'p1', report_date: '2026-06-16', check_type: 'daily', symptom_description: 'Sem sintomas relevantes', had_symptoms: false, completed: true, painLevel: 0, riskFlags: [] },
  { id: 'r2', user_id: 'p1', report_date: '2026-06-17', check_type: 'daily', symptom_description: 'Dor de cabeça leve', had_symptoms: true, completed: true, painLevel: 2, riskFlags: [] },
  { id: 'r3', user_id: 'p1', report_date: '2026-06-18', check_type: 'risk', symptom_description: 'Febre baixa e fadiga', had_symptoms: true, completed: true, painLevel: 4, riskFlags: ['febre'] },
  { id: 'r4', user_id: 'p2', report_date: '2026-06-18', check_type: 'risk', symptom_description: 'Falta de ar ao esforço', had_symptoms: true, completed: true, painLevel: 6, riskFlags: ['dispneia', 'risco cardiovascular'] },
];

export const mockAnamnese: Anamnese[] = [
  { id: 'a1', user_id: 'p1', info: 'Histórico resumido e minimizado para interface clínica.' },
  { id: 'a2', user_id: 'p2', info: 'Paciente em acompanhamento de rotina com fatores de risco controlados.' },
];
