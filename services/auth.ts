<<<<<<< HEAD
import type { UserRead } from '@/lib/types';
import { api } from './api';

export function getMe() {
  return api<UserRead>('/api/auth/me');
=======
import type { Role, User } from '@/lib/types';
import { authProvider } from '@/infrastructure/auth';
import { audit } from './audit';

export async function getCurrentUser(defaultRole: Role = 'patient'): Promise<User | null> {
  const user = await authProvider.getCurrentUser(defaultRole);

  if (user) audit(user.id, 'session.read', process.env.AUTH_PROVIDER ?? 'mock');

  return user;
>>>>>>> dda01fb (Decouple auth and API infrastructure)
}
