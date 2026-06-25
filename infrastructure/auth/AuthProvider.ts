import type { Role, User } from '@/lib/types';

export type SignInInput = {
  email: string;
  password: string;
};

export interface AuthProvider {
  getCurrentUser(defaultRole?: Role): Promise<User | null>;
  signIn?(input: SignInInput): Promise<User>;
  signOut?(): Promise<void>;
  getAccessToken?(): Promise<string | null>;
}
