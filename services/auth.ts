import type { UserRead } from '@/lib/types';
import { api } from './api';

export function getMe() {
  return api<UserRead>('/api/auth/me');
}
