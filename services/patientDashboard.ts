import type { DailyReport, MonitoringPlan, ProfessionalProfile } from '@/lib/types';

export type PatientDashboardSummary = {
  activePlan?: MonitoringPlan;
  monitoringStatus: 'active' | 'ended';
  planName: string;
  startDateLabel: string;
  daysInCare: number;
  lastCheckInLabel: string;
  nextCheckInLabel: string;
  hasPendingCheckIn: boolean;
  answeredCheckIns: number;
  adherenceRate: number;
  daysWithoutSymptoms: number;
  daysWithSymptoms: number;
  recentCheckIns: PatientDashboardCheckIn[];
  professional?: ProfessionalProfile;
};

export type PatientDashboardCheckIn = {
  id: number;
  date: string;
  dateLabel: string;
  answered: boolean;
  symptomStatus: 'none' | 'reported' | 'missing';
};

function parseDate(date?: string | null) {
  if (!date) return undefined;
  const parsed = new Date(`${date.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function getDateKey(report: DailyReport) {
  return report.report_date ?? report.created_at?.slice(0, 10) ?? '';
}

function isAnswered(report: DailyReport) {
  return report.status === 'COMPLETED' || Boolean(report.completed);
}

function isPending(report: DailyReport) {
  return !isAnswered(report) && report.status !== 'EXPIRED';
}

function formatDate(date?: string | null) {
  const parsed = parseDate(date);
  if (!parsed) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(parsed);
}

function formatShortDate(date?: string | null) {
  const parsed = parseDate(date);
  if (!parsed) return 'Sem data';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(parsed);
}

function differenceInDaysFromToday(date?: string | null) {
  const parsed = parseDate(date);
  if (!parsed) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(1, Math.floor((today.getTime() - parsed.getTime()) / 86400000) + 1);
}

function getActivePlan(plans: MonitoringPlan[]) {
  return plans.find((plan) => plan.active || String(plan.status ?? '').toLowerCase() === 'active') ?? plans.find((plan) => !plan.ends_at) ?? plans[0];
}

function getNextCheckInLabel(reports: DailyReport[]) {
  const pending = reports.filter(isPending).sort((left, right) => getDateKey(left).localeCompare(getDateKey(right)))[0];
  if (pending) return `Hoje ou até ${formatDate(getDateKey(pending))}`;
  return 'Sua equipe ainda não definiu uma próxima data.';
}

export function createPatientDashboardSummary(reports: DailyReport[], plans: MonitoringPlan[]): PatientDashboardSummary {
  const activePlan = getActivePlan(plans);
  const activePlanId = activePlan?.id;
  const planReports = activePlanId ? reports.filter((report) => !report.monitoring_plan_id || report.monitoring_plan_id === activePlanId) : reports;
  const orderedReports = [...planReports].sort((left, right) => getDateKey(right).localeCompare(getDateKey(left)));
  const answeredReports = orderedReports.filter(isAnswered);
  const daysWithSymptoms = answeredReports.filter((report) => Boolean(report.had_symptoms)).length;
  const daysWithoutSymptoms = answeredReports.filter((report) => report.had_symptoms === false).length;
  const professional = activePlan?.professionals?.[0];
  const monitoringStatus = activePlan && (activePlan.active || String(activePlan.status ?? '').toLowerCase() === 'active') ? 'active' : 'ended';

  return {
    activePlan,
    monitoringStatus,
    planName: activePlan?.name || 'Plano de acompanhamento',
    startDateLabel: formatDate(activePlan?.starts_at ?? activePlan?.created_at),
    daysInCare: differenceInDaysFromToday(activePlan?.starts_at ?? activePlan?.created_at),
    lastCheckInLabel: answeredReports[0] ? formatDate(getDateKey(answeredReports[0])) : 'Nenhum check-in respondido ainda',
    nextCheckInLabel: getNextCheckInLabel(orderedReports),
    hasPendingCheckIn: orderedReports.some(isPending),
    answeredCheckIns: answeredReports.length,
    adherenceRate: orderedReports.length ? Math.round((answeredReports.length / orderedReports.length) * 100) : 0,
    daysWithoutSymptoms,
    daysWithSymptoms,
    recentCheckIns: orderedReports.slice(0, 7).map((report) => {
      const answered = isAnswered(report);
      return {
        id: report.id,
        date: getDateKey(report),
        dateLabel: formatShortDate(getDateKey(report)),
        answered,
        symptomStatus: !answered ? 'missing' : report.had_symptoms ? 'reported' : 'none',
      };
    }),
    professional,
  };
}
