import { mockUsers } from '@/lib/mockData';
import type { User } from '@/lib/types';
import { USE_MOCK, api } from './api';
import { audit } from './audit';
export async function getCurrentUser(role='patient'):Promise<User|null>{if(USE_MOCK){const user=mockUsers.find(u=>u.role===role)??mockUsers[0]; audit(user.id,'login','session'); return user} return api<User>('/auth/me')}
