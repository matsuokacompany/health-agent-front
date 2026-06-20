export type ApiClientOptions = {
  baseURL?: string;
  defaultHeaders?: HeadersInit;
};

export class ApiClient {
  private readonly baseURL: string;
  private readonly defaultHeaders: HeadersInit;

  constructor(options: ApiClientOptions = {}) {
    this.baseURL = options.baseURL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
    this.defaultHeaders = options.defaultHeaders ?? { 'content-type': 'application/json' };
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      ...init,
      credentials: 'include',
      headers: { ...this.defaultHeaders, ...(init.headers || {}) },
    });

    if (!response.ok) throw new Error(`API ${response.status}`);

    if (response.status === 204) return undefined as T;

    return response.json() as Promise<T>;
  }

  get<T>(path: string, init: RequestInit = {}) {
    return this.request<T>(path, { ...init, method: init.method ?? 'GET' });
  }

  post<T>(path: string, body?: unknown, init: RequestInit = {}) {
    return this.request<T>(path, {
      ...init,
      method: 'POST',
      body: body === undefined ? init.body : JSON.stringify(body),
    });
  }
}

export const apiClient = new ApiClient();
