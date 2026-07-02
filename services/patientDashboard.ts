import { api } from './api';

export type DashboardPeriod = '7d' | '30d' | '90d' | '1y' | 'custom';
export type DashboardStatus = 'all' | 'pending' | 'completed' | 'expired' | 'incomplete';
export type DashboardSymptomFilter = 'all' | 'with' | 'without';
export type SortDirection = 'asc' | 'desc';

export type DashboardProfessional = { id: number | string; name: string; specialty?: string | null; photo_url?: string | null; avatar_url?: string | null };
export type DashboardPlan = { id: number | string; name: string; status: string; starts_at?: string | null; ends_at?: string | null; active?: boolean };
export type DashboardCheckIn = { id: number | string; date: string; status: DashboardStatus | string; title?: string; had_symptoms?: boolean | null; symptom_description?: string | null; completed?: boolean };
export type DashboardAlert = { id: number | string; title: string; description?: string; severity?: 'info' | 'warning' | 'danger' | 'success' | string };
export type DashboardStatistic = { label: string; value: number | string; description?: string; trend?: number; tone?: 'neutral' | 'success' | 'warning' | 'danger' };

export type PatientDashboardOverview = {
  patient?: { id?: number | string; name?: string };
  activePlan?: DashboardPlan | null;
  professionals?: DashboardProfessional[];
  anamnesisSummary?: string | null;
  todayCheckIn?: DashboardCheckIn | null;
  nextCheckIn?: DashboardCheckIn | null;
  statistics?: DashboardStatistic[];
  alerts?: DashboardAlert[];
};

export type PatientDashboardCalendarDay = { date: string; status?: string; has_checkin?: boolean; had_symptoms?: boolean | null };
export type PatientDashboardCalendar = { year: number; month: number; days: PatientDashboardCalendarDay[]; planStartsAt?: string | null; planEndsAt?: string | null };

export type PaginatedResponse<T> = { items: T[]; total: number; page: number; perPage: number; totalPages?: number };
export type HistoryParams = { page: number; perPage: number; period: DashboardPeriod; status: DashboardStatus; symptoms: DashboardSymptomFilter; sort: SortDirection; from?: string; to?: string };
export type CheckInsParams = { page: number; perPage: number; status: DashboardStatus };
export type StatisticsParams = { period: DashboardPeriod; from?: string; to?: string };
export type PatientDashboardStatistics = { cards: DashboardStatistic[]; charts: Array<{ id: string; title: string; data: Array<{ label: string; value: number }> }> };

function withQuery(path: string, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') search.set(key, String(value)); });
  const query = search.toString();
  return `${path}${query ? `?${query}` : ''}`;
}

export const patientDashboardApi = {
  getOverview: () => api<PatientDashboardOverview>('/patient/dashboard'),
  getCalendar: (year: number, month: number) => api<PatientDashboardCalendar>(withQuery('/patient/dashboard/calendar', { year, month })),
  getHistory: (params: HistoryParams) => api<PaginatedResponse<DashboardCheckIn>>(withQuery('/patient/dashboard/history', params)),
  getStatistics: (params: StatisticsParams) => api<PatientDashboardStatistics>(withQuery('/patient/dashboard/statistics', params)),
  getCheckIns: (params: CheckInsParams) => api<PaginatedResponse<DashboardCheckIn>>(withQuery('/patient/dashboard/checkins', params)),
};
