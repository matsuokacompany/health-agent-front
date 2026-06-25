import { cookies } from 'next/headers';
import { mockUsers } from '@/lib/mockData';
import type { Role, User } from '@/lib/types';
import type { AuthProvider } from './AuthProvider';

const isRole = (value: string | undefined): value is Role =>
  value === 'patient' || value === 'professional' || value === 'admin';

export class MockAuth implements AuthProvider {
  async getCurrentUser(defaultRole: Role = 'patient'): Promise<User> {
    let cookieRole: string | undefined;

    try {
      cookieRole = (await cookies()).get('role')?.value;
    } catch {
      cookieRole = undefined;
    }

    const role = isRole(cookieRole) ? cookieRole : defaultRole;

    return mockUsers.find((candidate) => candidate.role === role) ?? mockUsers[0];
  }

  async getAccessToken(): Promise<string | null> {
    return null;
  }
}
