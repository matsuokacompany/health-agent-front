export type Session = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  user?: { id: string; email?: string } | null;
};

export type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'INITIAL_SESSION' | 'USER_UPDATED' | 'PASSWORD_RECOVERY';

type AuthError = { message: string } | null;
type AuthListener = (event: AuthChangeEvent, session: Session | null) => void;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '';
const passwordResetRedirectUrl = process.env.NEXT_PUBLIC_PASSWORD_RESET_REDIRECT_URL;
const storageKey = 'health-agent.supabase.session';
const listeners = new Set<AuthListener>();

function authEndpoint(path: string, params?: Record<string, string | undefined>) {
  if (!supabaseUrl) throw new Error('Supabase URL não configurada. Defina NEXT_PUBLIC_SUPABASE_URL.');

  const url = new URL(`${supabaseUrl.replace(/\/$/, '')}/auth/v1${path}`);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  return url.toString();
}

function authHeaders(token?: string) {
  if (!supabaseAnonKey) throw new Error('Supabase anon key não configurada. Defina NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  return {
    apikey: supabaseAnonKey,
    authorization: `Bearer ${token ?? supabaseAnonKey}`,
    'content-type': 'application/json',
  };
}

function getStoredSession(): Session | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Session;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export function storeSession(session: Session | null) {
  if (typeof window === 'undefined') return;
  if (session) window.localStorage.setItem(storageKey, JSON.stringify(session));
  else window.localStorage.removeItem(storageKey);
}

function notify(event: AuthChangeEvent, session: Session | null) {
  listeners.forEach((listener) => listener(event, session));
}

async function readAuthError(response: Response): Promise<AuthError> {
  try {
    const payload = await response.json() as { msg?: string; message?: string; error_description?: string; error?: string };
    return { message: payload.msg ?? payload.message ?? payload.error_description ?? payload.error ?? 'Falha de autenticação.' };
  } catch {
    return { message: 'Falha de autenticação.' };
  }
}

export const supabase = {
  auth: {
    async getSession(): Promise<{ data: { session: Session | null }; error: AuthError }> {
      return { data: { session: getStoredSession() }, error: null };
    },

    async signInWithPassword(credentials: { email: string; password: string }): Promise<{ data: { session: Session | null }; error: AuthError }> {
      const response = await fetch(authEndpoint('/token?grant_type=password'), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(credentials),
      });

      if (!response.ok) return { data: { session: null }, error: await readAuthError(response) };

      const session = await response.json() as Session;
      storeSession(session);
      notify('SIGNED_IN', session);
      return { data: { session }, error: null };
    },

    async resetPasswordForEmail(email: string, redirectTo?: string): Promise<{ error: AuthError }> {
      const response = await fetch(authEndpoint('/recover', { redirect_to: redirectTo }), {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ email }),
      });

      return { error: response.ok ? null : await readAuthError(response) };
    },

    async updateUser(attributes: { password: string }): Promise<{ data: { user: unknown | null }; error: AuthError }> {
      const session = getStoredSession();
      if (!session?.access_token) return { data: { user: null }, error: { message: 'Sessão não encontrada. Faça login novamente.' } };

      const response = await fetch(authEndpoint('/user'), {
        method: 'PUT',
        headers: authHeaders(session.access_token),
        body: JSON.stringify(attributes),
      });

      if (!response.ok) return { data: { user: null }, error: await readAuthError(response) };

      const user = await response.json() as unknown;
      notify('USER_UPDATED', session);
      return { data: { user }, error: null };
    },

    async signOut(): Promise<{ error: AuthError }> {
      const session = getStoredSession();
      storeSession(null);
      notify('SIGNED_OUT', null);

      if (!session?.access_token || !supabaseUrl || !supabaseAnonKey) return { error: null };

      const response = await fetch(authEndpoint('/logout'), {
        method: 'POST',
        headers: authHeaders(session.access_token),
      });

      return { error: response.ok ? null : await readAuthError(response) };
    },

    onAuthStateChange(callback: AuthListener): { data: { subscription: { unsubscribe(): void } } } {
      listeners.add(callback);
      callback('INITIAL_SESSION', getStoredSession());

      return {
        data: {
          subscription: {
            unsubscribe() {
              listeners.delete(callback);
            },
          },
        },
      };
    },
  },
};

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function signOut() {
  return supabase.auth.signOut();
}

export function onAuthStateChange(callback: AuthListener) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function resetPasswordForEmail(email: string) {
  const redirectTo = passwordResetRedirectUrl ?? (typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined);
  const { error } = await supabase.auth.resetPasswordForEmail(email, redirectTo);
  if (error) throw new Error(error.message);
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

export function recoverSessionFromUrl(): Session | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.hash.replace(/^#/, '') || window.location.search.replace(/^\?/, ''));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token') ?? undefined;

  if (!accessToken) {
    const session = getStoredSession();
    if (session?.access_token) return session;
    throw new Error('Link de redefinição inválido ou expirado. Solicite um novo link.');
  }

  const session: Session = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: Number(params.get('expires_in') ?? 0) || undefined,
    expires_at: Number(params.get('expires_at') ?? 0) || undefined,
    token_type: params.get('token_type') ?? 'bearer',
  };

  storeSession(session);
  notify('PASSWORD_RECOVERY', session);
  window.history.replaceState(null, document.title, window.location.pathname);
  return session;
}
