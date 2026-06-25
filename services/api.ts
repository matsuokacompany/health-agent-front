import { apiClient } from '@/infrastructure/http/ApiClient';

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

export function api<T>(path: string, init: RequestInit = {}) {
  return apiClient.request<T>(path, init);
}
