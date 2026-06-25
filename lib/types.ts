export type RoleName = 'super_admin' | 'admin' | 'professional' | 'patient';
export type Role = RoleName;

export type UserRead = {
  id: number;
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
  roles: RoleName[];
};

export type Consent = {
  user_id: string;
  accepted_at: string;
  version: string;
  ip_address?: string;
  revoked_at?: string;
};

export type User = UserRead & {
  role?: RoleName;
  avatarUrl?: string;
  linkedPatientIds?: Array<number | string>;
  consent?: Consent;
};

export type PatientProfile = User & {
  age: number;
  diagnosis: string;
  lastCheckIn: string;
  riskLevel: 'baixo' | 'moderado' | 'alto';
};

export type DailyReport = {
  id: string | number;
  user_id: number;
  report_date: string;
  check_type: 'daily' | 'risk';
  symptom_description: string;
  had_symptoms: boolean;
  completed: boolean;
  painLevel: number;
  riskFlags: string[];
};

export type Anamnese = { id: string | number; user_id: number; info: string };
export type AuditLog = { user_id: string | number; action: string; resource: string; timestamp: string };
export type AiReport = { risk: 'baixo' | 'moderado' | 'alto'; summary: string; recommendations: string[] };
