import type { Anamnese } from '@/lib/types';
import { api } from './api';
export const anamnesesApi = {
  me: () => api<Anamnese>('/api/anamneses/me'),
  create: (payload: Anamnese) => api<Anamnese>('/api/anamneses/', { method: 'POST', body: JSON.stringify(payload) }),
  updateMe: (payload: Anamnese) => api<Anamnese>('/api/anamneses/me', { method: 'PUT', body: JSON.stringify(payload) }),
  byUser: (userId: number) => api<Anamnese>(`/api/anamneses/user/${userId}`),
  remove: (id: number) => api<void>(`/api/anamneses/${id}`, { method: 'DELETE' }),
};
export const getAnamnese = (_user: unknown, patientId: number) => anamnesesApi.byUser(patientId);
export const saveAnamnese = (_user: unknown, data: Anamnese) => data.id ? anamnesesApi.updateMe(data) : anamnesesApi.create(data);
