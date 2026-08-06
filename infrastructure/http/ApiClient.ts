export type ApiClientOptions = {
  baseUrl?: string;
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

const CSRF_COOKIE_NAMES = ['ha-csrf-token', 'csrf_token', 'XSRF-TOKEN'];
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
let refreshPromise: Promise<boolean> | null = null;

function resolveConfiguredBaseUrl(baseUrl?: string) {
  return baseUrl
    ?? process.env.NEXT_PUBLIC_API_URL
    ?? process.env['NEXT_PUBLIC_API_URL']
    ?? process.env.NEXT_PUBLIC_API_BASE_URL
    ?? process.env['NEXT_PUBLIC_API_BASE_URL']
    ?? process.env.VITE_API_URL
    ?? process.env['VITE_API_URL']
    ?? process.env.VITE_API_BASE_URL
    ?? process.env['VITE_API_BASE_URL'];
}

function resolveRequestBaseUrl(baseUrl?: string) {
  if (baseUrl) return baseUrl;
  if (process.env.NODE_ENV === 'test') return 'http://localhost';
  throw new Error('API URL não configurada. Defina NEXT_PUBLIC_API_URL ou NEXT_PUBLIC_API_BASE_URL para este ambiente.');
}

function readCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';').map((cookie) => cookie.trim());
  const prefix = `${name}=`;
  const match = cookies.find((cookie) => cookie.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

function readCsrfToken() {
  for (const name of CSRF_COOKIE_NAMES) {
    const token = readCookie(name);
    if (token) return token;
  }
  return null;
}

function shouldAttachCsrf(method: string) {
  return MUTATING_METHODS.has(method.toUpperCase());
}

function shouldTryRefresh(path: string, response: Response, retryOnUnauthorized: boolean) {
  return response.status === 401 && retryOnUnauthorized && path !== '/api/auth/refresh' && path !== '/api/auth/login' && path !== '/api/auth/logout';
}

export class ApiClient {
  private readonly baseUrl?: string;
  private readonly onUnauthorized?: () => void;

  constructor({ baseUrl, onUnauthorized }: ApiClientOptions = {}) {
    this.baseUrl = resolveConfiguredBaseUrl(baseUrl)?.replace(/\/$/, '');
    this.onUnauthorized = onUnauthorized;
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    return this.requestWithRefresh<T>(path, init, true);
  }

  private async requestWithRefresh<T>(path: string, init: RequestInit, retryOnUnauthorized: boolean): Promise<T> {
    const response = await this.fetchWithCookies(path, init);

    if (response.ok) return parseResponse<T>(response);

    if (shouldTryRefresh(path, response, retryOnUnauthorized) && await this.refreshSession()) {
      const retryResponse = await this.fetchWithCookies(path, init);
      if (retryResponse.ok) return parseResponse<T>(retryResponse);
      return this.handleError<T>(path, retryResponse);
    }

    return this.handleError<T>(path, response);
  }

  private async fetchWithCookies(path: string, init: RequestInit) {
    const baseUrl = resolveRequestBaseUrl(this.baseUrl);
    const method = init.method ?? 'GET';
    const headers = new Headers(init.headers);

    if (!headers.has('content-type') && init.body) headers.set('content-type', 'application/json');

    const csrfToken = readCsrfToken();
    if (csrfToken && shouldAttachCsrf(method) && !headers.has('x-csrf-token')) headers.set('x-csrf-token', csrfToken);

    return fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });
  }

  private async refreshSession() {
    refreshPromise ??= this.requestWithRefresh<void>('/api/auth/refresh', { method: 'POST' }, false)
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });

    return refreshPromise;
  }

  private async handleError<T>(path: string, response: Response): Promise<T> {
    const payload = await readErrorPayload(response);

    if (response.status === 401) {
      this.onUnauthorized?.();
      if (path !== '/api/auth/me' && typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') window.location.assign('/login');
      throw new UnauthorizedError(payload);
    }

    if (response.status === 403) throw new ForbiddenError(payload);
    if (response.status === 409) throw new ConflictError(payload);

    throw new ApiError('Ocorreu um erro inesperado.', response.status, payload);
  }
}

async function parseResponse<T>(response: Response) {
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
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
