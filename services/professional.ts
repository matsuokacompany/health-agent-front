import { ApiError, ForbiddenError } from '@/infrastructure/http/ApiClient';
import type { Allergy, AllergyInput, AllergyUpdate, Supplement, SupplementInput, SupplementUpdate } from '@/lib/types';
import type { AnamneseRiskFactors } from '@/lib/anamneseRiskFactors';
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
  has_own_subscription: boolean;
};

export type CreateProfessionalPatientRequest = {
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  birth_date?: string;
  gender?: string;
  city?: string;
  state?: string;
  plan_title: string;
  plan_description?: string;
  plan_start_date?: string;
  plan_end_date?: string;
  supplements?: SupplementInput[];
  allergies?: AllergyInput[];
};

export type CreatedPatient = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  cpf?: string | null;
  supabase_user_id: string | null;
  created_at: string;
  updated_at: string;
  roles: ['patient'] | string[];
};

export type CreateProfessionalPatientResponse = {
  patient: CreatedPatient;
  monitoring_plan: {
    id: number;
    patient_id: number;
    title: string;
    description?: string | null;
    active: boolean;
    start_date?: string | null;
    end_date?: string | null;
    created_at: string;
    updated_at: string;
  };
};

export type Anamnese = {
  id: number;
  user_id: number;
  info: string;
  medication_allergies?: string | null;
  food_restrictions?: string | null;
  created_at: string;
  updated_at: string;
} & AnamneseRiskFactors;

export type SaveAnamnesePayload = { info: string; medication_allergies?: string | null; food_restrictions?: string | null } & Partial<AnamneseRiskFactors>;

export async function getPatientAnamnese(patientId: number | string): Promise<Anamnese | null> {
  try {
    return await api<Anamnese>(`/api/professional/patients/${patientId}/anamnese`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export function createPatientAnamnese(patientId: number | string, payload: SaveAnamnesePayload) {
  return api<Anamnese>(`/api/professional/patients/${patientId}/anamnese`, { method: 'POST', body: JSON.stringify(payload) });
}

export function updatePatientAnamnese(patientId: number | string, payload: SaveAnamnesePayload) {
  return api<Anamnese>(`/api/professional/patients/${patientId}/anamnese`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function getPatientSupplements(patientId: number | string) {
  return api<Supplement[]>(`/api/professional/patients/${patientId}/supplements`);
}

export function createPatientSupplement(patientId: number | string, payload: SupplementInput) {
  return api<Supplement>(`/api/professional/patients/${patientId}/supplements`, { method: 'POST', body: JSON.stringify(payload) });
}

export function updatePatientSupplement(patientId: number | string, supplementId: number, payload: SupplementUpdate) {
  return api<Supplement>(`/api/professional/patients/${patientId}/supplements/${supplementId}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export function deletePatientSupplement(patientId: number | string, supplementId: number) {
  return api<void>(`/api/professional/patients/${patientId}/supplements/${supplementId}`, { method: 'DELETE' });
}

export function getPatientAllergies(patientId: number | string) {
  return api<Allergy[]>(`/api/professional/patients/${patientId}/allergies`);
}

export function createPatientAllergy(patientId: number | string, payload: AllergyInput) {
  return api<Allergy>(`/api/professional/patients/${patientId}/allergies`, { method: 'POST', body: JSON.stringify(payload) });
}

export function updatePatientAllergy(patientId: number | string, allergyId: number, payload: AllergyUpdate) {
  return api<Allergy>(`/api/professional/patients/${patientId}/allergies/${allergyId}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export function deletePatientAllergy(patientId: number | string, allergyId: number) {
  return api<void>(`/api/professional/patients/${patientId}/allergies/${allergyId}`, { method: 'DELETE' });
}

export function createProfessionalPatient(payload: CreateProfessionalPatientRequest) {
  return api<CreateProfessionalPatientResponse>('/api/professional/patients', { method: 'POST', body: JSON.stringify(payload) });
}

export type ProfessionalDashboard = {
  user?: { id?: number | string; name?: string; first_name?: string; avatar?: string | null };
  monitoring?: { id?: number | string; active?: boolean; title?: string | null; start_date?: string | null; end_date?: string | null; days_active?: number | null; days_remaining?: number | null } | null;
  today?: { has_checkin?: boolean; completed?: boolean; status?: string | null; prompt_sent_at?: string | null; answered_at?: string | null } | null;
  next_checkin?: { scheduled_at?: string | null } | null;
  anamnesis_summary?: { has_anamnesis?: boolean; conditions_count?: number; preview?: string[] | string | null } | null;
  statistics?: { total?: number; answered?: number; missed?: number; with_symptoms?: number; without_symptoms?: number; adherence?: number } | null;
  last_response?: { date?: string | null; status?: string | null; had_symptoms?: boolean | null } | null;
  professionals?: Array<{ id: number | string; name: string; specialty?: string | null }>;
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
  red_flag_category?: string | null;
  suspected_cause?: string | null;
  diet_adherence?: boolean | null;
  /** Free-text answer to "o que você comeu fora da dieta?" -- only ever set when diet_adherence is false. */
  lifestyle_notes?: string | null;
  exercise_adherence?: boolean | null;
  medication_adherence?: boolean | null;
  medication_adherence_level?: 'ALL' | 'PARTIAL' | 'NONE' | null;
  prompt_sent_at?: string | null;
  answered_at?: string | null;
  expires_at?: string | null;
};

export type ProfessionalSymptomTermSample = { report_id: number; report_date: string; description: string };
export type ProfessionalTopSymptomTerm = { label: string; count: number; samples: ProfessionalSymptomTermSample[] };

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

export type ProfessionalCalendarCheckin = {
  id: number | string;
  check_type?: string | null;
  status?: string | null;
  completed?: boolean;
  had_symptoms?: boolean | null;
  symptom_description?: string | null;
  red_flag_category?: string | null;
  diet_adherence?: boolean | null;
  /** Free-text answer to "o que você comeu fora da dieta?" -- only ever set when diet_adherence is false. */
  lifestyle_notes?: string | null;
  exercise_adherence?: boolean | null;
  medication_adherence?: boolean | null;
  medication_adherence_level?: 'ALL' | 'PARTIAL' | 'NONE' | null;
  prompt_sent_at?: string | null;
  answered_at?: string | null;
};
export type ProfessionalCalendarDay = {
  date: string;
  has_checkin: boolean;
  completed: boolean;
  pending: boolean;
  has_symptoms: boolean;
  diet_followed: boolean;
  exercise_followed: boolean;
  medication_taken: boolean;
  medication_partial: boolean;
  statuses: Array<string | null>;
  checkins: ProfessionalCalendarCheckin[];
};
export type ProfessionalCalendar = { year: number; month: number; days: ProfessionalCalendarDay[] };
export type AiReportPeriod = 'diario' | 'semanal' | 'mensal';
export type AiReportMode = 'preventivo' | 'avaliacao_clinica';
export type SuspicionLevel = 'baixo' | 'moderado' | 'alto';
export type PriorityLevel = 'baixa' | 'media' | 'alta';

export type ClinicalHypothesis = {
  doenca: string;
  raciocinio: string;
  especialista_recomendado: string;
  nivel_de_suspeicao: SuspicionLevel | string;
};

// At most 5 -- see InsightService._prompt_avaliacao_clinica on the backend,
// ordered from most to least likely; fewer than 5 when the model is more
// confident, never padded with weak guesses just to fill the list.
export type ClinicalAiReport = {
  hipoteses: ClinicalHypothesis[];
  exames_prioritarios: string[];
  urgencia: PriorityLevel | string;
  alerta_legal: string;
};

export type LongTermRisk = {
  condicao: string;
  raciocinio: string;
  especialista_recomendado: string;
  nivel_de_atencao: SuspicionLevel | string;
};

export type PreventiveAiReport = {
  riscos_longo_prazo: LongTermRisk[];
  alerta_importante: string;
};

export type ProfessionalAiReportRequest = { periodo?: AiReportPeriod; modo?: AiReportMode };
export type ProfessionalAiReportResponse = { patient_id: number; periodo: AiReportPeriod; modo: AiReportMode; clinical_summary: string; ai: ClinicalAiReport | PreventiveAiReport };

function withQuery(path: string, params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') search.set(key, String(value)); });
  const query = search.toString();
  return `${path}${query ? `?${query}` : ''}`;
}

export const professionalApi = {
  listPatients: () => api<ProfessionalPatient[]>('/api/professional/patients'),
  createPatient: createProfessionalPatient,
  getDashboard: (patientId: number | string) => api<ProfessionalDashboard>(`/api/professional/patients/${patientId}/dashboard`),
  getCheckIns: (patientId: number | string, params: ProfessionalCheckInsParams) => api<ProfessionalPaginatedResponse<ProfessionalCheckIn>>(withQuery(`/api/professional/patients/${patientId}/checkins`, params)),
  getCalendar: (patientId: number | string, year: number, month: number) => api<ProfessionalCalendar>(withQuery(`/api/professional/patients/${patientId}/calendar`, { year, month })),
  getSymptomTerms: (patientId: number | string, limit = 6) => api<{ items: ProfessionalTopSymptomTerm[] }>(withQuery(`/api/professional/patients/${patientId}/symptom-terms`, { limit })),
  getAnamnese: getPatientAnamnese,
  createAnamnese: createPatientAnamnese,
  updateAnamnese: updatePatientAnamnese,
  /** @deprecated Use aiReportsApi para preview, geração personalizada e histórico. */
  async generateAiReport(patientId: number | string, payload: ProfessionalAiReportRequest = {}) {
    try {
      return await api<ProfessionalAiReportResponse>(`/api/professional/patients/${patientId}/ai-report`, { method: 'POST', body: JSON.stringify({ periodo: payload.periodo ?? 'semanal', modo: payload.modo ?? 'avaliacao_clinica' }) });
    } catch (error) {
      if (error instanceof ForbiddenError) throw new Error('Você não tem permissão profissional para gerar relatório de IA.');
      throw error;
    }
  },
};
