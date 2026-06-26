import type { DailyReport, MonitoringPlan } from '@/lib/types';

export type MonitoringDayStatus = 'Respondido' | 'Não respondido' | 'Sem envio' | 'Incompleto';

export type MonitoringCalendarDay = {
  date: string;
  status: MonitoringDayStatus;
  className: string;
  report?: DailyReport;
};

export type PatientMonitoringSummary = {
  startsAt: string | null;
  endsAt: string | null;
  status: string;
};

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function createMockMonitoringSummary(plan?: MonitoringPlan): PatientMonitoringSummary {
  return {
    startsAt: plan?.starts_at ?? null,
    endsAt: plan?.ends_at ?? null,
    status: plan?.status ?? (plan?.active ? 'active' : 'inactive'),
  };
}

export function getReportMonitoringStatus(report?: DailyReport): Omit<MonitoringCalendarDay, 'date' | 'report'> {
  if (!report) return { status: 'Sem envio', className: 'is-empty' };
  if (report.status === 'COMPLETED' || report.completed) return { status: 'Respondido', className: 'is-complete' };
  if (report.status === 'PENDING') return { status: 'Não respondido', className: 'is-pending' };
  return { status: 'Incompleto', className: 'is-issue' };
}

export function createMockMonthlyMonitoringCalendar(reports: DailyReport[], reference = new Date()): MonitoringCalendarDay[] {
  const first = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const count = new Date(reference.getFullYear(), reference.getMonth() + 1, 0).getDate();
  const byDate = new Map(reports.map((report) => [report.report_date, report]));
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(first);
    day.setDate(index + 1);
    const date = dateKey(day);
    const report = byDate.get(date);
    return { date, report, ...getReportMonitoringStatus(report) };
  });
}
