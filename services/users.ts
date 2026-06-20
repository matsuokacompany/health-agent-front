import { mockUsers } from '@/lib/mockData';
import type { User } from '@/lib/types';
import { USE_MOCK, apiClient } from './api';
import { audit } from './audit';

export async function getUser(requester: User, userId: string) {
  audit(requester.id, 'user.read', `user:${userId}`);

  if (USE_MOCK) return mockUsers.find((user) => user.id === userId) ?? null;

  return apiClient.get<User>(`/users/${userId}`);
}

export async function listUsers(requester: User) {
  if (requester.role !== 'admin') return [];

  audit(requester.id, 'users.list', 'users');

  if (USE_MOCK) return mockUsers;

  return apiClient.get<User[]>('/users');
}
