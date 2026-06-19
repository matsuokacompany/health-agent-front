export type Role = 'patient' | 'professional' | 'admin';

export type Consent = {
  user_id: string;
  accepted_at: string;
  version: string;
  ip_address?: string;
  revoked_at?: string;
};

export type User = {
  id: string;
  role: Role;
  email: string;
  name: string;
  avatarUrl?: string;
  linkedPatientIds?: string[];
  consent?: Consent;
};

export type PatientProfile = User & {
  age: number;
  diagnosis: string;
  lastCheckIn: string;
  riskLevel: 'baixo' | 'moderado' | 'alto';
};

export type DailyReport = {
  id: string;
  user_id: string;
  report_date: string;
  check_type: 'daily' | 'risk';
  symptom_description: string;
  had_symptoms: boolean;
  completed: boolean;
  painLevel: number;
  riskFlags: string[];
};

export type Anamnese = { id: string; user_id: string; info: string };
export type AuditLog = { user_id: string; action: string; resource: string; timestamp: string };
export type AiReport = { risk: 'baixo' | 'moderado' | 'alto'; summary: string; recommendations: string[] };
