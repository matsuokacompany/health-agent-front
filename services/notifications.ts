import type { AppNotification, NotificationListResponse } from '@/lib/types';
import { api } from './api';

export const notificationsApi = {
  list: () => api<NotificationListResponse>('/api/notifications'),
  markRead: (id: number) => api<AppNotification>(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => api<NotificationListResponse>('/api/notifications/read-all', { method: 'POST' }),
};
