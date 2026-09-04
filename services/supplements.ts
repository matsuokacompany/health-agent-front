import type { Supplement } from '@/lib/types';
import { api } from './api';

export const supplementsApi = {
  list: () => api<Supplement[]>('/api/supplements/me'),
  create: (name: string) => api<Supplement>('/api/supplements/', { method: 'POST', body: JSON.stringify({ name }) }),
  remove: (id: number) => api<void>(`/api/supplements/${id}`, { method: 'DELETE' }),
};
