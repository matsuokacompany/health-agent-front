import type { DailyReportStatus, Role } from '@/lib/types';
export function RoleBadge({ role }: { role: Role }) { return <span className="badge">{role}</span>; }
export function StatusBadge({ status }: { status: DailyReportStatus | string }) {
  const cls = status === 'COMPLETED' ? 'risk-baixo' : status === 'EXPIRED' ? 'risk-alto' : 'risk-moderado';
  return <span className={`badge ${cls}`}>{status}</span>;
}
