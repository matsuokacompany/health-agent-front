import { getSession, signOut as supabaseSignOut } from '@/lib/supabase';

export type ApiClientOptions = {
  baseUrl?: string;
  getAccessToken?: () => Promise<string | null>;
  onUnauthorized?: () => void;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(payload?: unknown) {
    super('Sessão expirada. Faça login novamente.', 401, payload);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(payload?: unknown) {
    super('Permissão insuficiente para acessar este recurso.', 403, payload);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends ApiError {
  constructor(payload?: unknown) {
    super('Não foi possível salvar porque já existe um cadastro com estes dados.', 409, payload);
    this.name = 'ConflictError';
  }
}

async function defaultAccessToken() {
  const session = await getSession();
  return session?.access_token ?? null;
}

function resolveDefaultBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.VITE_API_URL;
  if (configuredUrl) return configuredUrl;
  if (process.env.NODE_ENV === 'test') return 'http://localhost';
  throw new Error('API URL não configurada. Defina NEXT_PUBLIC_API_URL para este ambiente.');
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly getAccessToken: () => Promise<string | null>;
  private readonly onUnauthorized?: () => void;

  constructor({ baseUrl = resolveDefaultBaseUrl(), getAccessToken = defaultAccessToken, onUnauthorized }: ApiClientOptions = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.getAccessToken = getAccessToken;
    this.onUnauthorized = onUnauthorized;
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken();
    const headers = new Headers(init.headers);

    if (!headers.has('content-type') && init.body) headers.set('content-type', 'application/json');
    if (token) headers.set('authorization', `Bearer ${token}`);

    const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers });

    if (response.ok) {
      if (response.status === 204) return undefined as T;
      return response.json() as Promise<T>;
    }

    const payload = await readErrorPayload(response);

    if (response.status === 401) {
      await supabaseSignOut();
      this.onUnauthorized?.();
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') window.location.assign('/login');
      throw new UnauthorizedError(payload);
    }

    if (response.status === 403) throw new ForbiddenError(payload);
    if (response.status === 409) throw new ConflictError(payload);

    throw new ApiError('Ocorreu um erro inesperado.', response.status, payload);
  }
}

async function readErrorPayload(response: Response) {
  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export const apiClient = new ApiClient();
