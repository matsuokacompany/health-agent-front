import { cookies } from 'next/headers';
import { mockUsers } from '@/lib/mockData';
import type { Role } from '@/lib/types';
import { audit } from '@/services/audit';
import type { AuthProvider } from './types';

export class MockAuth implements AuthProvider {
  async getCurrentUser(defaultRole: Role = 'patient') {
    const cookieRole = (await cookies()).get('role')?.value as Role | undefined;
    const role = cookieRole ?? defaultRole;
    const user = mockUsers.find((candidate) => candidate.role === role) ?? mockUsers[0];
    audit(user.id, 'session.mock', 'cookie');
    return user;
  }

  getAuthorizationUrl() {
    return '/callback';
  }
}
