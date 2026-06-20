import { cookies } from 'next/headers';
import { mockUsers } from '@/lib/mockData';
import type { Role, User } from '@/lib/types';
import { audit } from './audit';

const isRole = (value: string | undefined): value is Role =>
  value === 'patient' || value === 'professional' || value === 'admin';

export async function getCurrentUser(defaultRole: Role = 'patient'): Promise<User> {
  const cookieRole = (await cookies()).get('role')?.value;
  const role = isRole(cookieRole) ? cookieRole : defaultRole;
  const user = mockUsers.find((candidate) => candidate.role === role) ?? mockUsers[0];

  audit(user.id, 'session.mock', 'cookie');

  return user;
}
