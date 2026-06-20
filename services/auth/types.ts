import type { Role, User } from '@/lib/types';

export interface AuthProvider {
  getCurrentUser(defaultRole?: Role): Promise<User | null>;
  getAuthorizationUrl(): string;
  handleCallback?(searchParams: URLSearchParams): Promise<void>;
}
