import { CheckCircle, ForkKnife, HourglassHigh, Leaf, PersonSimpleRun, Pill, Stethoscope } from '@phosphor-icons/react/ssr';
import { MetricCard } from '@/components/ui/design';
import type { EvolutionReport } from '@/lib/types';

/** The at-a-glance adherence/symptom metrics shared by the live
 * automonitoramento page and a past AI summary's detail page -- same shape,
 * same tone rules, so a generated report and the live dashboard always
 * agree on what "good" looks like. Caller checks `sufficient_data`. */
export function EvolutionMetricsGrid({ report }: { report: EvolutionReport }) {
  const { adherence } = report;
  return <section className="patient-dashboard-summary-grid" aria-label="Métricas do período">
    <MetricCard icon={<CheckCircle aria-hidden="true" size={22} weight="duotone" />} label="Adesão aos check-ins" value={`${report.metrics.adherence_percentage}%`} description={`${report.metrics.completed_checkins} de ${report.metrics.total_checkins} check-ins`} tone={report.metrics.adherence_percentage >= 80 ? 'ok' : 'warn'} />
    <MetricCard icon={<Stethoscope aria-hidden="true" size={22} weight="duotone" />} label="Dias com sintomas" value={report.metrics.checkins_with_symptoms} tone={report.metrics.checkins_with_symptoms > 0 ? 'warn' : 'ok'} />
    <MetricCard icon={<Leaf aria-hidden="true" size={22} weight="duotone" />} label="Dias sem sintomas" value={report.metrics.checkins_without_symptoms} tone="ok" />
    <MetricCard icon={<HourglassHigh aria-hidden="true" size={22} weight="duotone" />} label="Maior intervalo sem responder" value={`${report.longest_gap_days} dias`} tone={report.longest_gap_days > 2 ? 'warn' : undefined} />
    {adherence.diet_percentage !== null ? <MetricCard icon={<ForkKnife aria-hidden="true" size={22} weight="duotone" />} label="Adesão à dieta" value={`${adherence.diet_percentage}%`} tone={adherence.diet_percentage >= 80 ? 'ok' : 'warn'} /> : null}
    {adherence.exercise_percentage !== null ? <MetricCard icon={<PersonSimpleRun aria-hidden="true" size={22} weight="duotone" />} label="Adesão ao exercício" value={`${adherence.exercise_percentage}%`} tone={adherence.exercise_percentage >= 80 ? 'ok' : 'warn'} /> : null}
    {adherence.medication_percentage !== null ? <MetricCard icon={<Pill aria-hidden="true" size={22} weight="duotone" />} label="Adesão à medicação/suplemento" value={`${adherence.medication_percentage}%`} tone={adherence.medication_percentage >= 80 ? 'ok' : 'warn'} /> : null}
  </section>;
}
