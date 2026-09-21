export const DAILY_REPORT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  AWAITING_SYMPTOM_DESCRIPTION: 'Aguardando sintomas',
  AWAITING_CAUSE: 'Aguardando causa (legado)',
  COMPLETED: 'Concluído',
  EXPIRED: 'Expirado',
};

const STATUS_BADGE_TONE: Record<string, string> = {
  COMPLETED: 'risk-baixo',
  PENDING: 'tone-muted',
  AWAITING_SYMPTOM_DESCRIPTION: 'risk-moderado',
  AWAITING_CAUSE: 'risk-moderado',
  EXPIRED: 'risk-alto',
};

export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="badge tone-muted">—</span>;
  const label = DAILY_REPORT_STATUS_LABELS[status] ?? status;
  return <span className={`badge ${STATUS_BADGE_TONE[status] ?? 'tone-muted'}`}>{label}</span>;
}
