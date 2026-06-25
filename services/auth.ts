import type { Role, User } from '@/lib/types';
import { authProvider } from '@/infrastructure/auth';
import { audit } from './audit';

export async function getCurrentUser(defaultRole: Role = 'patient'): Promise<User | null> {
  const user = await authProvider.getCurrentUser(defaultRole);

  if (user) audit(user.id, 'session.read', process.env.AUTH_PROVIDER ?? 'mock');

  return user;
}
