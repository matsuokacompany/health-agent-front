'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/design';
import { usePatientDashboardCalendar } from '@/hooks/usePatientDashboard';
import type { DashboardPlan } from '@/services/patientDashboard';
import { DashboardSection } from './DashboardSection';

function monthKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; }
function parseMonth(value?: string | null) { if (!value) return undefined; const date = new Date(`${value.slice(0, 10)}T00:00:00`); return Number.isNaN(date.getTime()) ? undefined : new Date(date.getFullYear(), date.getMonth(), 1); }
function addMonths(date: Date, amount: number) { return new Date(date.getFullYear(), date.getMonth() + amount, 1); }
function compareMonths(left: Date, right: Date) { return left.getFullYear() === right.getFullYear() ? left.getMonth() - right.getMonth() : left.getFullYear() - right.getFullYear(); }

export function PatientCalendar({ plan }: { plan?: DashboardPlan | null }) {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const firstAllowedMonth = parseMonth(plan?.starts_at) ?? currentMonth;
  const lastAllowedMonth = parseMonth(plan?.ends_at) ?? new Date(today.getFullYear(), today.getMonth(), 1);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;
  const { data, isLoading, isFetching } = usePatientDashboardCalendar(year, month);
  const days = data?.days ?? [];
  const firstDay = new Date(year, currentMonth.getMonth(), 1).getDay();
  const totalDays = new Date(year, currentMonth.getMonth() + 1, 0).getDate();
  const byDate = new Map(days.map((day) => [day.date, day]));
  const canGoPrevious = compareMonths(addMonths(currentMonth, -1), firstAllowedMonth) >= 0;
  const canGoNext = compareMonths(addMonths(currentMonth, 1), lastAllowedMonth) <= 0;

  return <DashboardSection title="Calendário" eyebrow="Check-ins por mês" loading={isLoading} className={isFetching && !isLoading ? 'is-updating' : ''} skeletonLines={7}>
    <div className="calendar-header"><div><strong>{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentMonth)}</strong><p className="muted compact">Navegue apenas dentro do período ativo do plano.</p></div><div className="calendar-nav"><Button variant="secondary" disabled={!canGoPrevious} onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>Anterior</Button><Button variant="secondary" disabled={!canGoNext} onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>Próximo</Button></div></div>
    <div className="patient-calendar-grid">{Array.from({ length: firstDay }, (_, index) => <span className="patient-calendar-empty" key={`empty-${index}`} />)}{Array.from({ length: totalDays }, (_, index) => {
      const day = index + 1;
      const date = `${monthKey(currentMonth)}-${String(day).padStart(2, '0')}`;
      const entry = byDate.get(date);
      return <div className={`patient-calendar-day ${entry?.status ?? 'empty'}`} key={date}><strong>{day}</strong><span>{entry?.has_checkin ? entry.status ?? 'check-in' : '—'}</span></div>;
    })}</div>
  </DashboardSection>;
}
