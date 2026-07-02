import type { DashboardCheckIn, DashboardStatus } from '@/services/patientDashboard';

export function formatDashboardDate(value?: string | null) {
  if (!value) return 'Não informado';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Não informado';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function getCheckInStatusLabel(status?: string) {
  const labels: Record<string, string> = { all: 'Todos', pending: 'Pendente', completed: 'Respondido', expired: 'Expirado', incomplete: 'Incompleto' };
  return labels[String(status ?? '').toLowerCase()] ?? status ?? 'Não informado';
}

export function normalizeCheckInStatus(checkIn?: DashboardCheckIn | null): DashboardStatus {
  if (!checkIn) return 'incomplete';
  const status = String(checkIn.status ?? '').toLowerCase();
  if (status === 'completed' || checkIn.completed) return 'completed';
  if (status === 'pending') return 'pending';
  if (status === 'expired') return 'expired';
  return 'incomplete';
}
