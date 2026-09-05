import type { SupplementDosagePeriod } from './types';

export const PERIOD_LABELS: Record<SupplementDosagePeriod, { singular: string; plural: string }> = {
  DAY: { singular: 'dia', plural: 'dias' },
  WEEK: { singular: 'semana', plural: 'semanas' },
  MONTH: { singular: 'mês', plural: 'meses' },
};

export function formatDosageSchedule(dosageTimes: number, dosagePeriod: SupplementDosagePeriod, durationDays: number | null) {
  const period = PERIOD_LABELS[dosagePeriod] ?? PERIOD_LABELS.DAY;
  const frequency = `${dosageTimes}x por ${period.singular}`;
  const duration = durationDays == null ? 'uso contínuo' : `por ${durationDays} ${durationDays === 1 ? 'dia' : 'dias'}`;
  return `${frequency} · ${duration}`;
}
