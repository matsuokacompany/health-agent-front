import type { Allergy, AllergyInput, AllergyUpdate } from '@/lib/types';
import { api } from './api';

export const allergiesApi = {
  list: () => api<Allergy[]>('/api/allergies/me'),
  create: (input: AllergyInput) => api<Allergy>('/api/allergies/', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: number, input: AllergyUpdate) => api<Allergy>(`/api/allergies/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id: number) => api<void>(`/api/allergies/${id}`, { method: 'DELETE' }),
};
