import { apiClient } from '@/infrastructure/http/ApiClient';

export function api<T>(path: string, init: RequestInit = {}) {
  return apiClient.request<T>(path, init);
}
