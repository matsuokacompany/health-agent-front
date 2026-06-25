import type { RoleName, User, UserRead } from '@/lib/types';
import { api } from './api';
import { audit } from './audit';

export async function listUsers(requester: User): Promise<UserRead[]> {
  if (!requester.roles.some((role) => role === 'admin' || role === 'super_admin')) throw new Error('forbidden');
  audit(requester.id, 'users.list', 'users');
  return api<UserRead[]>('/api/users/');
}

export async function getUser(requester: User, userId: number): Promise<UserRead | null> {
  if (!requester.roles.some((role) => role === 'admin' || role === 'super_admin') && requester.id !== userId) throw new Error('forbidden');
  audit(requester.id, 'user.read', `user:${userId}`);
  return api<UserRead>(`/api/users/${userId}`);
}

export async function updateUserRoles(requester: User, userId: number, roles: RoleName[]): Promise<UserRead> {
  if (!requester.roles.includes('super_admin')) throw new Error('forbidden');
  audit(requester.id, 'user.roles.update', `user:${userId}`);
  return api<UserRead>(`/api/users/${userId}/roles`, { method: 'PUT', body: JSON.stringify({ roles }) });
}
