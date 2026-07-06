import type { Anamnese } from '@/lib/types';
import { api } from './api';

export type ProfessionalPatient = {
  patient_id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  monitoring_plan_id: number;
  plan_title?: string | null;
  active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  last_checkin_at?: string | null;
  last_status?: string | null;
  symptom_reports_count: number;
};

export type ProfessionalDashboard = {
  user?: { id?: number | string; name?: string; first_name?: string; avatar?: string | null };
  monitoring?: { id?: number | string; active?: boolean; title?: string | null; start_date?: string | null; end_date?: string | null; days_active?: number | null; days_remaining?: number | null } | null;
  today?: { has_checkin?: boolean; completed?: boolean; status?: string | null; prompt_sent_at?: string | null; answered_at?: string | null } | null;
  next_checkin?: { scheduled_at?: string | null } | null;
  anamnesis_summary?: { has_anamnesis?: boolean; conditions_count?: number; preview?: string[] | string | null } | null;
  statistics?: { total?: number; answered?: number; missed?: number; with_symptoms?: number; without_symptoms?: number; adherence?: number } | null;
  last_response?: { date?: string | null; status?: string | null; had_symptoms?: boolean | null } | null;
  professionals?: Array<{ id: number | string; name: string; specialty?: string | null }>;
  alerts?: Array<{ id?: number | string; title?: string; description?: string; severity?: string }>;
};

export type ProfessionalCheckIn = {
  id: number | string;
  monitoring_plan_id?: number | null;
  report_date?: string | null;
  check_type?: string | null;
  status?: string | null;
  completed?: boolean;
  had_symptoms?: boolean | null;
  symptom_description?: string | null;
  suspected_cause?: string | null;
  prompt_sent_at?: string | null;
  answered_at?: string | null;
  expires_at?: string | null;
};

export type ProfessionalCheckInsParams = {
  page: number;
  per_page: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  had_symptoms?: boolean | '';
  order: 'asc' | 'desc';
};

export type ProfessionalPaginatedResponse<T> = { items: T[]; pagination: { page: number; per_page: number; total: number; total_pages: number } };
export type ProfessionalAiReportRequest = { periodo?: 'diario' | 'semanal' | 'mensal'; modo?: 'preventivo' | 'avaliacao_clinica' };
export type ProfessionalAiReportResponse = { patient_id: number; periodo: string; modo: string; clinical_summary: string; ai: unknown };

function withQuery(path: string, params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') search.set(key, String(value)); });
  const query = search.toString();
  return `${path}${query ? `?${query}` : ''}`;
}

export const professionalApi = {
  listPatients: () => api<ProfessionalPatient[]>('/api/professional/patients'),
  getDashboard: (patientId: number | string) => api<ProfessionalDashboard>(`/api/professional/patients/${patientId}/dashboard`),
  getCheckIns: (patientId: number | string, params: ProfessionalCheckInsParams) => api<ProfessionalPaginatedResponse<ProfessionalCheckIn>>(withQuery(`/api/professional/patients/${patientId}/checkins`, params)),
  getAnamnese: (patientId: number | string) => api<Anamnese>(`/api/professional/patients/${patientId}/anamnese`),
  generateAiReport: (patientId: number | string, payload: ProfessionalAiReportRequest) => api<ProfessionalAiReportResponse>(`/api/professional/patients/${patientId}/ai-report`, { method: 'POST', body: JSON.stringify(payload) }),
};
