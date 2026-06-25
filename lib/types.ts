export type Role = 'super_admin' | 'admin' | 'professional' | 'patient';
export type RoleName = Role;

export type User = {
  id: number | string;
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
  registry?: string | null;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type MonitoringPlan = {
  id: number;
  patient_id: number;
  name?: string;
  status?: string;
  active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at?: string;
  updated_at?: string;
  professionals?: ProfessionalProfile[];
  [key: string]: unknown;
};

export type DailyReportStatus = 'PENDING' | 'AWAITING_SYMPTOM_DESCRIPTION' | 'AWAITING_CAUSE' | 'COMPLETED' | 'EXPIRED';

export type DailyReport = {
  id: number;
  user_id?: number;
  patient_id?: number;
  monitoring_plan_id?: number | null;
  report_date?: string;
  status: DailyReportStatus;
  symptom_description?: string | null;
  cause?: string | null;
  had_symptoms?: boolean | null;
  completed?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type ReportPeriod = 'diario' | 'semanal' | 'mensal';
export type GeneratedReport = { user_id: number; periodo: string; relatorio: string | object };

export type InsightPreventiveResponse = Record<string, unknown>;
export type InsightClinicalResponse = Record<string, unknown>;
export type AuditLog = { user_id: string | number; action: string; resource: string; timestamp: string };
export type AiReport = { risk: 'baixo' | 'moderado' | 'alto'; summary: string; recommendations: string[] };
export type PatientProfile = User & { age?: number; diagnosis?: string; lastCheckIn?: string; riskLevel?: 'baixo' | 'moderado' | 'alto' };
