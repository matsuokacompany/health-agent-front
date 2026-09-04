export type Role = 'super_admin' | 'admin' | 'professional' | 'patient';
export type RoleName = Role;

export type User = {
  id: number | string;
  /** Internal patient record id; distinct from the authentication provider UUID. */
  patient_id?: number;
  ai_report_next_generation_at?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  cpf?: string | null;
  supabase_user_id?: string | null;
  created_at: string;
  updated_at: string;
  roles: Role[];
  role?: Role;
  linkedPatientIds?: Array<number | string>;
  consent?: { user_id?: string | number; accepted_at?: string; revoked_at?: string | null; version?: string; ip_address?: string };
};
export type UserRead = User;

export type Anamnese = {
  id?: number;
  user_id?: number;
  info?: string;
  [key: string]: unknown;
};

export type ProfessionalProfile = {
  id: number;
  user_id?: number | null;
  name?: string;
  specialty?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  registry?: string | null;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type MonitoringPlan = {
  id: number;
  patient_id: number;
  name?: string;
  title?: string;
  description?: string | null;
  status?: string;
  active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
  updated_at?: string;
  professionals?: ProfessionalProfile[];
  origin?: 'PROFESSIONAL' | 'SELF_SERVICE';
  [key: string]: unknown;
};

export type DailyReportStatus = 'PENDING' | 'AWAITING_SYMPTOM_DESCRIPTION' | 'AWAITING_CAUSE' | 'AWAITING_MEDICATION_ADHERENCE' | 'COMPLETED' | 'EXPIRED';

export type DailyReport = {
  id: number;
  user_id?: number;
  patient_id?: number;
  monitoring_plan_id?: number | null;
  report_date?: string;
  status: DailyReportStatus;
  symptom_description?: string | null;
  suspected_cause?: string | null;
  cause?: string | null;
  had_symptoms?: boolean | null;
  medication_adherence?: boolean | null;
  completed?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type ReportPeriod = 'diario' | 'semanal' | 'mensal';
export type GeneratedReport = { user_id: number; periodo: string; relatorio: string | object };

export type SubscriptionStatus = 'PENDING' | 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
export type Subscription = {
  status: SubscriptionStatus;
  current_period_end?: string | null;
  trial_ends_at?: string | null;
  plan_id?: string | null;
  cancel_at_period_end?: boolean;
  first_paid_at?: string | null;
  // Professional-only: the active-patient cap for the current plan tier
  // (null also means "no cap", e.g. grandfathered) and how many active
  // patients they currently have. Always null for a patient's own subscription.
  max_patients?: number | null;
  active_patient_count?: number | null;
};
export type CheckoutResponse = { checkout_url: string | null; status: SubscriptionStatus; plan_id?: string | null };
export type BillingPlan = { id: string; label: string; cycle: string; months: number; price_cents: number; max_patients?: number | null };
export type Invoice = {
  id: string;
  value: number;
  status: string;
  due_date?: string | null;
  payment_date?: string | null;
  invoice_url?: string | null;
  description?: string | null;
};

export type NotificationKind =
  | 'PAYMENT_OVERDUE'
  | 'TRIAL_ENDING'
  | 'ACCESS_ENDING'
  | 'PLAN_CHANGED'
  | 'AI_REPORT_READY'
  | 'SYMPTOM_REPORTED'
  | 'PATIENT_ASSIGNED'
  | 'CHECKIN_PENDING';
export type AppNotification = {
  id: number;
  kind: NotificationKind;
  message: string;
  read_at?: string | null;
  created_at: string;
};
export type NotificationListResponse = { items: AppNotification[]; unread_count: number };

export type EvolutionSymptomOccurrence = { description: string; occurrences: number; first_reported_at: string; last_reported_at: string };
export type EvolutionTimelineGroup = { start_date: string; end_date: string; metrics: EvolutionMetrics };
export type EvolutionMetrics = {
  total_checkins: number;
  completed_checkins: number;
  pending_checkins: number;
  checkins_with_symptoms: number;
  checkins_without_symptoms: number;
  days_with_checkins: number;
  adherence_percentage: number;
  symptom_rate_percentage: number;
  calendar_coverage_percentage: number;
};
export type EvolutionReport = {
  patient_id: number;
  start_date: string;
  end_date: string;
  period_days: number;
  aggregation: 'weekly' | 'monthly' | 'yearly';
  minimum_completed_checkins: number;
  sufficient_data: boolean;
  metrics: EvolutionMetrics;
  symptom_trend: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
  longest_gap_days: number;
  symptoms: EvolutionSymptomOccurrence[];
  timeline: EvolutionTimelineGroup[];
};

export type SelfMonitoringInsightResult = {
  resumo: string;
  pontos_positivos: string[];
  pontos_de_atencao: string[];
  sugestao: string;
  especialidade_sugerida?: string | null;
  urgencia_consulta?: 'baixa' | 'moderada' | 'alta' | null;
};
export type SelfMonitoringInsightListItem = {
  id: number;
  start_date: string;
  end_date: string;
  generated_at: string;
  next_generation_at?: string | null;
};
export type SelfMonitoringInsightListResponse = {
  items: SelfMonitoringInsightListItem[];
  pagination: { page: number; per_page: number; total: number; total_pages: number };
};
export type SelfMonitoringInsight = {
  id?: number;
  patient_id: number;
  start_date: string;
  end_date: string;
  sufficient_data: boolean;
  insight?: SelfMonitoringInsightResult | null;
  generated_at?: string | null;
  next_generation_at?: string | null;
};

export type InsightPreventiveResponse = Record<string, unknown>;
export type InsightClinicalResponse = Record<string, unknown>;
export type AuditLog = { user_id: string | number; action: string; resource: string; timestamp: string };
export type AiReport = { risk: 'baixo' | 'moderado' | 'alto'; summary: string; recommendations: string[] };
export type PatientProfile = User & { age?: number; diagnosis?: string; lastCheckIn?: string; riskLevel?: 'baixo' | 'moderado' | 'alto' };
