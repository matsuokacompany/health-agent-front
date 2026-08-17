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

export class NotFoundError extends ApiError {
  constructor(payload?: unknown) {
    super('O recurso solicitado não foi encontrado.', 404, payload);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(payload?: unknown) {
    super('Não foi possível salvar porque já existe um cadastro com estes dados.', 409, payload);
    this.name = 'ConflictError';
  }
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_EXEMPT_PATHS = new Set(['/api/auth/login', '/api/auth/forgot-password']);
let refreshPromise: Promise<boolean> | null = null;
let csrfToken: string | null = null;
let csrfPromise: Promise<string> | null = null;

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

export function clearCsrfToken() {
  csrfToken = null;
  csrfPromise = null;
}

export function refreshCsrfToken(baseUrl?: string): Promise<string> {
  if (csrfPromise) return csrfPromise;
  const requestBaseUrl = resolveRequestBaseUrl(resolveConfiguredBaseUrl(baseUrl)?.replace(/\/$/, ''));
  csrfPromise = fetch(`${requestBaseUrl}/api/auth/csrf`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Não foi possível obter o token CSRF: ${response.status}`);
    const headerToken = response.headers.get('X-CSRF-Token');
    const body = headerToken ? null : await response.json().catch(() => null) as { csrf_token?: string } | null;
    const token = headerToken ?? body?.csrf_token;
    if (!token) throw new Error('O backend não retornou um token CSRF.');
    csrfToken = token;
    return token;
  }).finally(() => { csrfPromise = null; });
  return csrfPromise;
}

export function getCsrfToken(baseUrl?: string) {
  return csrfToken ? Promise.resolve(csrfToken) : refreshCsrfToken(baseUrl);
}

function canSafelyRetry(init: RequestInit) {
  return init.body == null || typeof init.body === 'string' || init.body instanceof URLSearchParams;
}

function shouldTryRefresh(path: string, response: Response, retryOnUnauthorized: boolean) {
  return response.status === 401 && retryOnUnauthorized && path !== '/api/auth/refresh' && path !== '/api/auth/login' && path !== '/api/auth/logout';
}

export function shouldRedirectToLogin(path: string) {
  // Authentication endpoints are also used while the login page restores (or
  // discovers the absence of) a session. Reloading /login when one of those
  // requests returns 401 starts the same request again and creates a reload
  // loop. Protected API requests can still send the user back to login.
  return !path.startsWith('/api/auth/');
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
    const response = await this.fetchWithCookies(path, init, true);

    if (response.ok) return parseResponse<T>(response);

    if (shouldTryRefresh(path, response, retryOnUnauthorized) && await this.refreshSession()) {
      const retryResponse = await this.fetchWithCookies(path, init, true);
      if (retryResponse.ok) return parseResponse<T>(retryResponse);
      return this.handleError<T>(path, retryResponse);
    }

    return this.handleError<T>(path, response);
  }

  private async fetchWithCookies(path: string, init: RequestInit, retryCsrf: boolean): Promise<Response> {
    const baseUrl = resolveRequestBaseUrl(this.baseUrl);
    const method = init.method ?? 'GET';
    const headers = new Headers(init.headers);

    if (!headers.has('content-type') && init.body) headers.set('content-type', 'application/json');

    if (MUTATING_METHODS.has(method.toUpperCase()) && !CSRF_EXEMPT_PATHS.has(path) && !headers.has('x-csrf-token')) {
      headers.set('x-csrf-token', await getCsrfToken(baseUrl));
    }

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    });

    if (response.status === 403 && retryCsrf && canSafelyRetry(init)) {
      const payload = await response.clone().json().catch(() => null) as { detail?: string } | null;
      if (payload?.detail === 'Invalid CSRF token') {
        clearCsrfToken();
        await refreshCsrfToken(baseUrl);
        return this.fetchWithCookies(path, init, false);
      }
    }

    const rotatedToken = response.headers.get('X-CSRF-Token');
    if (response.ok && rotatedToken) csrfToken = rotatedToken;

    if (response.ok && path === '/api/auth/login' && !rotatedToken) await refreshCsrfToken(baseUrl);
    if (response.ok && path === '/api/auth/refresh' && !rotatedToken) {
      clearCsrfToken();
      await refreshCsrfToken(baseUrl);
    }
    return response;
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
      if (shouldRedirectToLogin(path) && typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') window.location.assign('/login');
      throw new UnauthorizedError(payload);
    }

    if (response.status === 403) throw new ForbiddenError(payload);
    if (response.status === 404) throw new NotFoundError(payload);
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
