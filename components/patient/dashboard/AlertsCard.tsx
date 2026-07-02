import { EmptyState } from '@/components/ui/states';
import type { DashboardAlert } from '@/services/patientDashboard';
import { DashboardSection } from './DashboardSection';

export function AlertsCard({ alerts, loading }: { alerts?: DashboardAlert[]; loading?: boolean }) {
  return <DashboardSection title="Alertas importantes" eyebrow="Atenção" loading={loading}>
    {alerts?.length ? <div className="patient-alert-list">{alerts.map((alert) => <div className={`patient-alert-item ${alert.severity ?? 'info'}`} key={alert.id}><strong>{alert.title}</strong>{alert.description ? <p className="muted compact">{alert.description}</p> : null}</div>)}</div> : <EmptyState description="Nenhum alerta importante no momento." />}
  </DashboardSection>;
}
