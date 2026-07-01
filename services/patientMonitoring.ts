import type { DailyReport, MonitoringPlan } from '@/lib/types';

export type MonitoringDayStatus = 'answered' | 'unanswered' | 'noCheckIn' | 'incomplete';

export type MonitoringCalendarDay = { date: string; status: MonitoringDayStatus; className: string; report?: DailyReport };
export type PatientMonitoringSummary = { startsAt: string | null; endsAt: string | null; status: string };
export type MonthKey = `${number}-${string}`;

function dateKey(date: Date) { return date.toISOString().slice(0, 10); }
export function monthKey(date: Date): MonthKey { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` as MonthKey; }
export function monthFromDateString(value?: string | null) { if (!value) return undefined; const date = new Date(`${value.slice(0, 10)}T00:00:00`); return Number.isNaN(date.getTime()) ? undefined : new Date(date.getFullYear(), date.getMonth(), 1); }
export function addMonths(date: Date, amount: number) { return new Date(date.getFullYear(), date.getMonth() + amount, 1); }
export function compareMonths(left: Date, right: Date) { return left.getFullYear() === right.getFullYear() ? left.getMonth() - right.getMonth() : left.getFullYear() - right.getFullYear(); }

export function getMonitoringMonthRange(plan?: MonitoringPlan, today = new Date()) {
  if (!plan) return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: new Date(today.getFullYear(), today.getMonth(), 1) };
  const start = monthFromDateString(plan.starts_at) ?? monthFromDateString(plan.created_at) ?? new Date(today.getFullYear(), today.getMonth(), 1);
  const explicitEnd = monthFromDateString(plan.ends_at);
  const end = explicitEnd ?? new Date(today.getFullYear(), today.getMonth(), 1);
  return compareMonths(end, start) < 0 ? { start, end: start } : { start, end };
}

export function createMockMonitoringSummary(plan?: MonitoringPlan): PatientMonitoringSummary { return { startsAt: plan?.starts_at ?? null, endsAt: plan?.ends_at ?? null, status: plan?.status ?? (plan?.active ? 'active' : 'inactive') }; }
export function getReportMonitoringStatus(report?: DailyReport): Omit<MonitoringCalendarDay, 'date' | 'report'> { if (!report) return { status: 'noCheckIn', className: 'is-empty' }; if (report.status === 'COMPLETED' || report.completed) return { status: 'answered', className: 'is-complete' }; if (report.status === 'PENDING') return { status: 'unanswered', className: 'is-pending' }; return { status: 'incomplete', className: 'is-issue' }; }

export function createMockMonthlyMonitoringCalendar(reports: DailyReport[], reference = new Date()): MonitoringCalendarDay[] {
  const first = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const count = new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate();
  const month = monthKey(first);
  const byDate = new Map(reports.filter((report) => report.report_date?.startsWith(month)).map((report) => [report.report_date, report]));
  return Array.from({ length: count }, (_, index) => { const day = new Date(first); day.setDate(index + 1); const date = dateKey(day); const report = byDate.get(date); return { date, report, ...getReportMonitoringStatus(report) }; });
}
