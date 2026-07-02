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
  professionals: DashboardProfessional[];
  anamnesisSummary?: string | null;
  todayCheckIn?: DashboardCheckIn | null;
  nextCheckIn?: DashboardCheckIn | null;
  statistics: DashboardStatistic[];
  alerts: DashboardAlert[];
};

export type PatientDashboardCalendarDay = { date: string; status?: string; has_checkin?: boolean; had_symptoms?: boolean | null };
export type PatientDashboardCalendar = { year: number; month: number; days: PatientDashboardCalendarDay[]; planStartsAt?: string | null; planEndsAt?: string | null };

export type PaginatedResponse<T> = { items: T[]; total: number; page: number; perPage: number; totalPages?: number };
export type HistoryParams = { page: number; perPage: number; period: DashboardPeriod; status: DashboardStatus; symptoms: DashboardSymptomFilter; sort: SortDirection; from?: string; to?: string };
export type CheckInsParams = { page: number; perPage: number; status: DashboardStatus };
export type StatisticsParams = { period: DashboardPeriod; from?: string; to?: string };
export type PatientDashboardStatistics = { cards: DashboardStatistic[]; charts: Array<{ id: string; title: string; data: Array<{ label: string; value: number }> }> };

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function withQuery(path: string, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value !== undefined && value !== '') search.set(key, String(value)); });
  const query = search.toString();
  return `${path}${query ? `?${query}` : ''}`;
}

function labelFromKey(key: string) {
  return key.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase());
}

function normalizeStatistic(item: unknown, fallbackLabel: string): DashboardStatistic | null {
  if (isRecord(item)) {
    const label = String(item.label ?? item.title ?? item.name ?? fallbackLabel);
    const value = item.value ?? item.total ?? item.count ?? item.percentage ?? item.percent;
    if (value === undefined || value === null) return null;
    return { label, value: typeof value === 'number' || typeof value === 'string' ? value : String(value), description: typeof item.description === 'string' ? item.description : undefined, trend: typeof item.trend === 'number' ? item.trend : undefined, tone: typeof item.tone === 'string' ? item.tone as DashboardStatistic['tone'] : undefined };
  }
  if (typeof item === 'number' || typeof item === 'string') return { label: fallbackLabel, value: item };
  return null;
}

export function normalizeStatisticList(value: unknown): DashboardStatistic[] {
  if (Array.isArray(value)) return value.map((item, index) => normalizeStatistic(item, `Indicador ${index + 1}`)).filter((item): item is DashboardStatistic => Boolean(item));
  if (!isRecord(value)) return [];
  const nestedCards = value.cards ?? value.items ?? value.statistics;
  if (Array.isArray(nestedCards)) return normalizeStatisticList(nestedCards);
  return Object.entries(value).map(([key, item]) => normalizeStatistic(item, labelFromKey(key))).filter((item): item is DashboardStatistic => Boolean(item));
}

function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (isRecord(value) && Array.isArray(value.items)) return value.items as T[];
  if (isRecord(value) && Array.isArray(value.data)) return value.data as T[];
  return [];
}

function normalizeAnamnesisSummary(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (!isRecord(value)) return null;

  const preview = value.preview ?? value.summary ?? value.text ?? value.description;
  if (typeof preview === 'string' && preview.trim()) return preview.trim();

  const hasAnamnesis = value.has_anamnesis ?? value.hasAnamnesis;
  if (hasAnamnesis === false) return null;

  const conditionsCount = value.conditions_count ?? value.conditionsCount;
  if (typeof conditionsCount === 'number') {
    if (conditionsCount === 0) return null;
    return `${conditionsCount} condição${conditionsCount === 1 ? '' : 'ões'} registrada${conditionsCount === 1 ? '' : 's'} na anamnese.`;
  }

  return null;
}

function normalizePaginated<T>(value: unknown, fallback: { page: number; perPage: number }): PaginatedResponse<T> {
  const source = isRecord(value) ? value : {};
  const items = normalizeArray<T>(value);
  const total = Number(source.total ?? source.count ?? items.length) || items.length;
  const page = Number(source.page ?? fallback.page) || fallback.page;
  const perPage = Number(source.perPage ?? source.per_page ?? fallback.perPage) || fallback.perPage;
  const totalPages = Number(source.totalPages ?? source.total_pages ?? Math.max(1, Math.ceil(total / perPage))) || 1;
  return { items, total, page, perPage, totalPages };
}

function normalizeOverview(value: unknown): PatientDashboardOverview {
  const source = isRecord(value) ? value : {};
  const activePlan = (source.activePlan ?? source.active_plan ?? source.plan ?? null) as DashboardPlan | null;
  return {
    patient: (source.patient ?? source.user) as PatientDashboardOverview['patient'],
    activePlan,
    professionals: normalizeArray<DashboardProfessional>(source.professionals ?? source.team),
    anamnesisSummary: normalizeAnamnesisSummary(source.anamnesisSummary ?? source.anamnesis_summary ?? source.anamnese_summary),
    todayCheckIn: (source.todayCheckIn ?? source.today_checkin ?? source.today_check_in ?? null) as DashboardCheckIn | null,
    nextCheckIn: (source.nextCheckIn ?? source.next_checkin ?? source.next_check_in ?? null) as DashboardCheckIn | null,
    statistics: normalizeStatisticList(source.statistics ?? source.stats ?? source.summary),
    alerts: normalizeArray<DashboardAlert>(source.alerts),
  };
}

function normalizeStatistics(value: unknown): PatientDashboardStatistics {
  const source = isRecord(value) ? value : {};
  const cards = normalizeStatisticList(source.cards ?? source.statistics ?? source.summary ?? value);
  const charts = normalizeArray<{ id: string; title: string; data: Array<{ label: string; value: number }> }>(source.charts);
  return { cards, charts };
}

function normalizeCalendar(value: unknown, year: number, month: number): PatientDashboardCalendar {
  const source = isRecord(value) ? value : {};
  return { year: Number(source.year ?? year), month: Number(source.month ?? month), days: normalizeArray<PatientDashboardCalendarDay>(source.days ?? value), planStartsAt: (source.planStartsAt ?? source.plan_starts_at ?? null) as string | null, planEndsAt: (source.planEndsAt ?? source.plan_ends_at ?? null) as string | null };
}

export const patientDashboardApi = {
  getOverview: async () => normalizeOverview(await api<unknown>('/patient/dashboard')),
  getCalendar: async (year: number, month: number) => normalizeCalendar(await api<unknown>(withQuery('/patient/dashboard/calendar', { year, month })), year, month),
  getHistory: async (params: HistoryParams) => normalizePaginated<DashboardCheckIn>(await api<unknown>(withQuery('/patient/dashboard/history', params)), params),
  getStatistics: async (params: StatisticsParams) => normalizeStatistics(await api<unknown>(withQuery('/patient/dashboard/statistics', params))),
  getCheckIns: async (params: CheckInsParams) => normalizePaginated<DashboardCheckIn>(await api<unknown>(withQuery('/patient/dashboard/checkins', params)), params),
};
