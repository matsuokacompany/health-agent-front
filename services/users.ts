import type { Role, User } from '@/lib/types';
import { assertSuperAdmin } from '@/lib/rbac';
import { api } from './api';
export type UserPayload = Partial<Omit<User, 'id' | 'created_at' | 'updated_at' | 'roles'>> & { roles?: Role[] };
export const usersApi = {
  list: () => api<User[]>('/api/users/'),
  get: (id: number) => api<User>(`/api/users/${id}`),
  create: (payload: UserPayload) => api<User>('/api/users/', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: number, payload: UserPayload) => api<User>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id: number) => api<void>(`/api/users/${id}`, { method: 'DELETE' }),
  updateRoles: (id: number, roles: Role[]) => api<User>(`/api/users/${id}/roles`, { method: 'PUT', body: JSON.stringify({ roles }) }),
};
export const listUsers = usersApi.list;
export const getUser = async (requester: User, userId: number) => {
  assertSuperAdmin(requester);
  return usersApi.get(userId);
};
export const updateUserRoles = async (requester: User, userId: number, roles: Role[]) => {
  assertSuperAdmin(requester);
  return usersApi.updateRoles(userId, roles);
};
