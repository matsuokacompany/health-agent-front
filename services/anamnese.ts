import type { Anamnese } from '@/lib/types';
import { api } from './api';

let currentUserAnamneseRequest: Promise<Anamnese> | null = null;

const fetchCurrentUserAnamnese = () => {
  if (!currentUserAnamneseRequest) {
    currentUserAnamneseRequest = api<Anamnese>('/api/anamneses/me').catch((error) => {
      currentUserAnamneseRequest = null;
      throw error;
    });
  }

  return currentUserAnamneseRequest;
};

const refreshCurrentUserAnamnese = (request: Promise<Anamnese>) => {
  currentUserAnamneseRequest = request;
  return request;
};

export const anamnesesApi = {
  me: fetchCurrentUserAnamnese,
  create: (payload: Anamnese) => refreshCurrentUserAnamnese(api<Anamnese>('/api/anamneses/', { method: 'POST', body: JSON.stringify(payload) })),
  updateMe: (payload: Anamnese) => refreshCurrentUserAnamnese(api<Anamnese>('/api/anamneses/me', { method: 'PUT', body: JSON.stringify(payload) })),
  byUser: (userId: number) => api<Anamnese>(`/api/anamneses/user/${userId}`),
  remove: (id: number) => {
    currentUserAnamneseRequest = null;
    return api<void>(`/api/anamneses/${id}`, { method: 'DELETE' });
  },
};
export const getAnamnese = (_user: unknown, patientId: number) => anamnesesApi.byUser(patientId);
export const saveAnamnese = (_user: unknown, data: Anamnese) => data.id ? anamnesesApi.updateMe(data) : anamnesesApi.create(data);
