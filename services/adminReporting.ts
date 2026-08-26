import { api } from './api';

export type AdminUserStatus = 'ACTIVE' | 'INACTIVE';

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  roles: string[];
  status: AdminUserStatus;
  created_at: string;
};

export type AdminUsersFilter = {
  role?: string;
  status?: AdminUserStatus;
  search?: string;
};

export type AdminCostEntry = {
  id: number;
  description: string;
  category?: string | null;
  amount_cents: number;
  incurred_on: string;
  created_by_user_id: number;
  created_at: string;
};

export type AdminCostEntryPayload = {
  description: string;
  category?: string;
  amount_cents: number;
  incurred_on: string;
};

export type AdminCostSummary = {
  start_date: string;
  end_date: string;
  ai_report_count: number;
  ai_report_cost_usd: number;
  whatsapp_message_count: number;
  whatsapp_cost_per_message_cents: number | null;
  whatsapp_cost_cents: number | null;
  manual_cost_entries: AdminCostEntry[];
  manual_cost_total_cents: number;
};

export type AdminWhatsappDailyPoint = { date: string; sent_count: number };

export type AdminWhatsappStats = {
  period_days: number;
  start_date: string;
  end_date: string;
  total_sent: number;
  daily: AdminWhatsappDailyPoint[];
  cost_per_message_cents: number | null;
  estimated_cost_cents: number | null;
};

function withQuery(path: string, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') search.set(key, String(value)); });
  const query = search.toString();
  return `${path}${query ? `?${query}` : ''}`;
}

export const adminReportingApi = {
  listUsers: (filters: AdminUsersFilter = {}) => api<AdminUser[]>(withQuery('/api/admin/users', filters)),
  getCosts: (params: { start_date?: string; end_date?: string } = {}) => api<AdminCostSummary>(withQuery('/api/admin/costs', params)),
  getWhatsappStats: (days = 30) => api<AdminWhatsappStats>(withQuery('/api/admin/whatsapp/stats', { days })),
  listCostEntries: (params: { start_date?: string; end_date?: string } = {}) =>
    api<AdminCostEntry[]>(withQuery('/api/admin/costs/entries', params)),
  createCostEntry: (payload: AdminCostEntryPayload) =>
    api<AdminCostEntry>('/api/admin/costs/entries', { method: 'POST', body: JSON.stringify(payload) }),
  deleteCostEntry: (entryId: number) => api<void>(`/api/admin/costs/entries/${entryId}`, { method: 'DELETE' }),
};
