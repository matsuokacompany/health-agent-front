import { apiClient } from '@/infrastructure/http/ApiClient';

<<<<<<< HEAD
=======
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

>>>>>>> dda01fb (Decouple auth and API infrastructure)
export function api<T>(path: string, init: RequestInit = {}) {
  return apiClient.request<T>(path, init);
}
