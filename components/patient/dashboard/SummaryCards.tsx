import { DashboardSection } from './DashboardSection';
import type { DashboardPlan, DashboardStatistic } from '@/services/patientDashboard';
import { formatDashboardDate } from './dashboardUtils';

export function SummaryCards({ plan, statistics, loading }: { plan?: DashboardPlan | null; statistics?: DashboardStatistic[]; loading?: boolean }) {
  return <DashboardSection title="Resumo do plano ativo" eyebrow="Monitoramento" loading={loading} className="patient-summary-card" skeletonLines={5}>
    <dl className="patient-info-list">
      <div><dt>Plano</dt><dd>{plan?.name ?? 'Plano de acompanhamento'}</dd></div>
      <div><dt>Status</dt><dd>{plan?.status ?? (plan?.active ? 'Ativo' : 'Não informado')}</dd></div>
      <div><dt>Início</dt><dd>{formatDashboardDate(plan?.starts_at)}</dd></div>
      <div><dt>Fim</dt><dd>{plan?.ends_at ? formatDashboardDate(plan.ends_at) : 'Em andamento'}</dd></div>
    </dl>
    <div className="patient-summary-grid">{(statistics ?? []).slice(0, 4).map((item) => <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}</div>
  </DashboardSection>;
}
