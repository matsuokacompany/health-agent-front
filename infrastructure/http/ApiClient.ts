import { authProvider } from '@/infrastructure/auth';

export type ApiClientOptions = {
  baseUrl?: string;
  getAccessToken?: () => Promise<string | null>;
};

export class ApiClient {
  private readonly baseUrl: string;
  private readonly getAccessToken?: () => Promise<string | null>;

  constructor({ baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000', getAccessToken }: ApiClientOptions = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.getAccessToken = getAccessToken;
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken?.();
    const headers = new Headers(init.headers);

    if (!headers.has('content-type') && init.body) headers.set('content-type', 'application/json');
    if (token) headers.set('authorization', `Bearer ${token}`);

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      credentials: 'include',
      headers,
    });

    if (!response.ok) throw new Error(`FastAPI request failed with status ${response.status}`);

    if (response.status === 204) return undefined as T;

    return response.json() as Promise<T>;
  }
}

export const apiClient = new ApiClient({ getAccessToken: () => authProvider.getAccessToken?.() ?? Promise.resolve(null) });
