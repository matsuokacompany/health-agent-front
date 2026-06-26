import type { DailyReport } from '@/lib/types';

export type DashboardRange = '7' | '30' | '90' | 'custom';

export type PatientDashboardFilters = {
  range: DashboardRange;
  startDate?: string;
  endDate?: string;
};

export type PatientDashboardMetrics = {
  totalMessagesSent: number;
  totalMessagesAnswered: number;
  responseRate: number;
  symptomDays: number;
  unansweredDays: number;
};

export type PatientDashboardTimelinePoint = {
  date: string;
  sent: number;
  answered: number;
};

export type PatientDashboardSymptomChart = {
  withSymptoms: number;
  withoutSymptoms: number;
  unanswered: number;
};

export type PatientDashboardData = {
  metrics: PatientDashboardMetrics;
  timeline: PatientDashboardTimelinePoint[];
  symptoms: PatientDashboardSymptomChart;
};

function isAnswered(report: DailyReport) {
  return report.status === 'COMPLETED' || Boolean(report.completed);
}

function getDateKey(report: DailyReport) {
  return report.report_date ?? new Date().toISOString().slice(0, 10);
}

export function filterReportsByDashboardPeriod(reports: DailyReport[], filters: PatientDashboardFilters) {
  return reports.filter((report) => {
    const date = getDateKey(report);
    if (filters.range === 'custom') {
      return (!filters.startDate || date >= filters.startDate) && (!filters.endDate || date <= filters.endDate);
    }
    const limit = new Date();
    limit.setDate(limit.getDate() - Number(filters.range));
    return new Date(`${date}T00:00:00`) >= limit;
  });
}

export function createMockPatientDashboardData(reports: DailyReport[], filters: PatientDashboardFilters): PatientDashboardData {
  const filtered = filterReportsByDashboardPeriod(reports, filters);
  const totalMessagesSent = filtered.length;
  const totalMessagesAnswered = filtered.filter(isAnswered).length;
  const symptomDays = filtered.filter((report) => Boolean(report.had_symptoms)).length;
  const unansweredDays = filtered.filter((report) => !isAnswered(report)).length;
  const byDate = new Map<string, PatientDashboardTimelinePoint>();

  filtered.forEach((report) => {
    const date = getDateKey(report);
    const current = byDate.get(date) ?? { date, sent: 0, answered: 0 };
    current.sent += 1;
    current.answered += isAnswered(report) ? 1 : 0;
    byDate.set(date, current);
  });

  return {
    metrics: {
      totalMessagesSent,
      totalMessagesAnswered,
      responseRate: totalMessagesSent ? Math.round((totalMessagesAnswered / totalMessagesSent) * 100) : 0,
      symptomDays,
      unansweredDays,
    },
    timeline: Array.from(byDate.values()).sort((left, right) => left.date.localeCompare(right.date)).slice(-14),
    symptoms: {
      withSymptoms: symptomDays,
      withoutSymptoms: Math.max(0, totalMessagesAnswered - symptomDays),
      unanswered: unansweredDays,
    },
  };
}
