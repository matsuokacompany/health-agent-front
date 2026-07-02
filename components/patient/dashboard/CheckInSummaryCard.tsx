import { Button } from '@/components/ui/design';
import type { DashboardCheckIn } from '@/services/patientDashboard';
import { DashboardSection } from './DashboardSection';
import { formatDashboardDate, getCheckInStatusLabel, normalizeCheckInStatus } from './dashboardUtils';

export function CheckInSummaryCard({ todayCheckIn, nextCheckIn, loading }: { todayCheckIn?: DashboardCheckIn | null; nextCheckIn?: DashboardCheckIn | null; loading?: boolean }) {
  const todayStatus = normalizeCheckInStatus(todayCheckIn);
  return <DashboardSection title="Check-ins" eyebrow="Hoje e próximo" loading={loading} className={todayStatus === 'pending' ? 'patient-pending-card' : 'patient-ok-card'}>
    <dl className="patient-info-list">
      <div><dt>Hoje</dt><dd>{todayCheckIn ? getCheckInStatusLabel(todayCheckIn.status) : 'Sem check-in para hoje'}</dd></div>
      <div><dt>Próximo</dt><dd>{nextCheckIn ? formatDashboardDate(nextCheckIn.date) : 'Não definido'}</dd></div>
    </dl>
    {todayStatus === 'pending' ? <Button href="/patient/monitoring">Responder agora</Button> : null}
  </DashboardSection>;
}
