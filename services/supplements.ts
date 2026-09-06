import type { Supplement, SupplementInput, SupplementUpdate } from '@/lib/types';
import { api } from './api';

export const supplementsApi = {
  list: () => api<Supplement[]>('/api/supplements/me'),
  create: (input: SupplementInput) => api<Supplement>('/api/supplements/', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: number, input: SupplementUpdate) => api<Supplement>(`/api/supplements/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id: number) => api<void>(`/api/supplements/${id}`, { method: 'DELETE' }),
};
