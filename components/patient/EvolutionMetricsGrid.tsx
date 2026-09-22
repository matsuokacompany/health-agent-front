import type { ReactNode } from 'react';
import { CheckCircle, Equals, ForkKnife, HourglassHigh, Leaf, PersonSimpleRun, Pill, Question, Stethoscope, TrendDown, TrendUp } from '@phosphor-icons/react/ssr';
import { MetricCard } from '@/components/ui/design';
import type { EvolutionReport } from '@/lib/types';

const trendMeta: Record<EvolutionReport['symptom_trend'], { icon: ReactNode; value: string; description: string; tone?: 'ok' | 'warn' }> = {
  increasing: { icon: <TrendUp aria-hidden="true" size={22} weight="duotone" />, value: 'Em alta', description: 'Sintomas em alta no período', tone: 'warn' },
  decreasing: { icon: <TrendDown aria-hidden="true" size={22} weight="duotone" />, value: 'Em queda', description: 'Sintomas em queda no período', tone: 'ok' },
  stable: { icon: <Equals aria-hidden="true" size={22} weight="duotone" />, value: 'Estável', description: 'Sem mudança relevante no período', tone: 'ok' },
  insufficient_data: { icon: <Question aria-hidden="true" size={22} weight="duotone" />, value: 'Sem dados', description: 'Dados insuficientes para calcular tendência' },
};

function percentageValue(value: number | null) {
  return value === null ? 'Não se aplica' : `${value}%`;
}

/** The at-a-glance adherence/symptom/trend metrics shared by the live
 * automonitoramento page and a past AI summary's detail page -- same shape,
 * same tone rules, so a generated report and the live dashboard always
 * agree on what "good" looks like. Diet/exercise/medication adherence are
 * always rendered (as "Não se aplica" when the patient doesn't track
 * that one) rather than conditionally hidden, so the grid always fills
 * exactly two full rows of four instead of leaving a half-empty row.
 * Caller checks `sufficient_data`. */
export function EvolutionMetricsGrid({ report }: { report: EvolutionReport }) {
  const { adherence } = report;
  const trend = trendMeta[report.symptom_trend];
  return <section className="patient-dashboard-summary-grid" aria-label="Métricas do período">
    <MetricCard icon={<CheckCircle aria-hidden="true" size={22} weight="duotone" />} label="Adesão aos check-ins" value={`${report.metrics.adherence_percentage}%`} description={`${report.metrics.completed_checkins} de ${report.metrics.total_checkins} check-ins`} tone={report.metrics.adherence_percentage >= 80 ? 'ok' : 'warn'} />
    <MetricCard icon={<Stethoscope aria-hidden="true" size={22} weight="duotone" />} label="Dias com sintomas" value={report.metrics.checkins_with_symptoms} tone={report.metrics.checkins_with_symptoms > 0 ? 'warn' : 'ok'} />
    <MetricCard icon={<Leaf aria-hidden="true" size={22} weight="duotone" />} label="Dias sem sintomas" value={report.metrics.checkins_without_symptoms} tone="ok" />
    <MetricCard icon={<HourglassHigh aria-hidden="true" size={22} weight="duotone" />} label="Maior intervalo sem responder" value={`${report.longest_gap_days} dias`} tone={report.longest_gap_days > 2 ? 'warn' : undefined} />
    <MetricCard icon={trend.icon} label="Tendência" value={trend.value} description={trend.description} tone={trend.tone} />
    <MetricCard icon={<ForkKnife aria-hidden="true" size={22} weight="duotone" />} label="Adesão à dieta" value={percentageValue(adherence.diet_percentage)} tone={adherence.diet_percentage !== null ? (adherence.diet_percentage >= 80 ? 'ok' : 'warn') : undefined} />
    <MetricCard icon={<PersonSimpleRun aria-hidden="true" size={22} weight="duotone" />} label="Adesão ao exercício" value={percentageValue(adherence.exercise_percentage)} tone={adherence.exercise_percentage !== null ? (adherence.exercise_percentage >= 80 ? 'ok' : 'warn') : undefined} />
    <MetricCard icon={<Pill aria-hidden="true" size={22} weight="duotone" />} label="Adesão à medicação/suplemento" value={percentageValue(adherence.medication_percentage)} tone={adherence.medication_percentage !== null ? (adherence.medication_percentage >= 80 ? 'ok' : 'warn') : undefined} />
  </section>;
}
