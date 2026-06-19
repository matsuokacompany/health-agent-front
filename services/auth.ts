import { cookies } from 'next/headers';
import { mockUsers } from '@/lib/mockData';
import type { Role, User } from '@/lib/types';
import { USE_MOCK, api } from './api';
import { audit } from './audit';

export async function getCurrentUser(defaultRole: Role = 'patient'): Promise<User | null> {
  if (USE_MOCK) {
    const cookieRole = (await cookies()).get('role')?.value as Role | undefined;
    const role = cookieRole ?? defaultRole;
    const user = mockUsers.find((candidate) => candidate.role === role) ?? mockUsers[0];
    audit(user.id, 'session.mock', 'cookie');
    return user;
  }
  return api<User>('/auth/me');
}

export function getLogtoAuthorizationUrl() {
  const endpoint = process.env.LOGTO_ENDPOINT ?? process.env.NEXT_PUBLIC_LOGTO_ENDPOINT ?? '';
  const appId = process.env.LOGTO_APP_ID ?? process.env.NEXT_PUBLIC_LOGTO_APP_ID ?? '';
  const redirectUri = process.env.LOGTO_REDIRECT_URI ?? 'https://app.julha.com.br/callback';
  const scope = encodeURIComponent('openid profile email roles');
  return `${endpoint}/oidc/auth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
}
