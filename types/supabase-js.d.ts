declare module '@supabase/supabase-js' {
  export type Session = { access_token: string; user?: { id: string; email?: string } | null };
  export type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'INITIAL_SESSION' | 'USER_UPDATED' | 'PASSWORD_RECOVERY';
  export type AuthResponse<T = unknown> = { data: T; error: { message: string } | null };
  export function createClient(url: string, key: string): {
    auth: {
      getSession(): Promise<{ data: { session: Session | null }; error: { message: string } | null }>;
      signInWithPassword(credentials: { email: string; password: string }): Promise<AuthResponse<{ session: Session | null }>>;
      signOut(): Promise<{ error: { message: string } | null }>;
      onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): { data: { subscription: { unsubscribe(): void } } };
    };
  };
}
