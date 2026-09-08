import type { Anamnese, User } from '@/lib/types';
import { assertCanAccessPatient } from '@/lib/rbac';
import { api } from './api';

// No caching here: a per-module cache not keyed by user id previously
// survived logout/login within the same tab, serving one account's
// anamnese to whichever account loaded next.
export const anamnesesApi = {
  me: () => api<Anamnese>('/api/anamneses/me'),
  create: (payload: Anamnese) => api<Anamnese>('/api/anamneses/me', { method: 'POST', body: JSON.stringify(payload) }),
  updateMe: (payload: Anamnese) => api<Anamnese>('/api/anamneses/me', { method: 'PUT', body: JSON.stringify(payload) }),
  byUser: (userId: number) => api<Anamnese>(`/api/anamneses/user/${userId}`),
  remove: (id: number) => api<void>(`/api/anamneses/${id}`, { method: 'DELETE' }),
};
export const getAnamnese = async (user: User, patientId: number) => {
  assertCanAccessPatient(user, patientId);
  return anamnesesApi.byUser(patientId);
};
export const saveAnamnese = (_user: unknown, data: Anamnese) => data.id ? anamnesesApi.updateMe(data) : anamnesesApi.create(data);
