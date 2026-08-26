import { api } from './api';

export type PatientLinkRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export type PatientLinkRequestIncoming = {
  id: number;
  status: PatientLinkRequestStatus;
  created_at: string;
  expires_at: string;
  responded_at?: string | null;
  professional_name: string;
  professional_specialty?: string | null;
};

export type PatientLinkRequestResult = {
  id: number;
  status: PatientLinkRequestStatus;
  created_at: string;
  expires_at: string;
  responded_at?: string | null;
};

export const patientLinksApi = {
  listIncoming: () => api<PatientLinkRequestIncoming[]>('/api/patient-links'),
  respond: (id: number, accept: boolean) =>
    api<PatientLinkRequestResult>(`/api/patient-links/${id}/respond`, { method: 'POST', body: JSON.stringify({ accept }) }),
};
