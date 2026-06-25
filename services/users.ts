import { mockUsers } from '@/lib/mockData';
import type { User } from '@/lib/types';
import { USE_MOCK, api } from './api';
import { audit } from './audit';

export async function getUser(requester: User, userId: string): Promise<User | null> {
  if (requester.role !== 'admin' && requester.id !== userId) throw new Error('forbidden');

  audit(requester.id, 'user.read', `user:${userId}`);

  if (USE_MOCK) return mockUsers.find((user) => user.id === userId) ?? null;

  return api<User>(`/users/${userId}`);
}

export async function getMe(requester: User): Promise<User> {
  audit(requester.id, 'user.me', `user:${requester.id}`);

  if (USE_MOCK) return requester;

  return api<User>('/users/me');
}
