export type Session = { access_token: string; user?: { id: string; email?: string } | null };
export type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'INITIAL_SESSION' | 'USER_UPDATED' | 'PASSWORD_RECOVERY';

type Listener = (event: AuthChangeEvent, session: Session | null) => void;

let session: Session | null = null;
const listeners = new Set<Listener>();

export function createClient() {
  return {
    auth: {
      async getSession() {
        return { data: { session }, error: null };
      },
      async signInWithPassword({ email }: { email: string; password: string }) {
        session = { access_token: 'test-token', user: { id: 'test-user', email } };
        listeners.forEach((listener) => listener('SIGNED_IN', session));
        return { data: { session }, error: null };
      },
      async signOut() {
        session = null;
        listeners.forEach((listener) => listener('SIGNED_OUT', null));
        return { error: null };
      },
      onAuthStateChange(callback: Listener) {
        listeners.add(callback);
        return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } };
      },
    },
  };
}
