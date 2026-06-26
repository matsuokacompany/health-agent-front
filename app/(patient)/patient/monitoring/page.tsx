'use client';

import { useMemo, useState } from 'react';
import { usePatientData } from '@/components/patient/PatientDataProvider';
import { Card, MetricCard, PageHeader } from '@/components/ui/design';
import { StatusBadge } from '@/components/ui/badges';
import { EmptyState } from '@/components/ui/states';
import type { DailyReport } from '@/lib/types';

function toKey(date: Date) { return date.toISOString().slice(0, 10); }
function state(report?: DailyReport) { if (!report) return { label: 'Sem envio', className: 'is-empty' }; if (report.status === 'COMPLETED' || report.completed) return { label: 'Respondido', className: 'is-complete' }; if (report.status === 'PENDING') return { label: 'Não respondido', className: 'is-pending' }; return { label: 'Incompleto', className: 'is-issue' }; }

export default function PatientMonitoring() {
  const { plans, reports } = usePatientData();
  const [selected, setSelected] = useState<DailyReport | undefined>();
  const active = plans.find((plan) => plan.active || plan.status === 'active') ?? plans[0];
  const days = useMemo(() => { const now = new Date(); const first = new Date(now.getFullYear(), now.getMonth(), 1); const count = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(); return Array.from({ length: count }, (_, index) => { const day = new Date(first); day.setDate(index + 1); return toKey(day); }); }, []);
  const byDate = useMemo(() => new Map(reports.map((report) => [report.report_date, report])), [reports]);
  const answered = reports.filter((report) => report.status === 'COMPLETED' || report.completed).length;

  return <><PageHeader eyebrow="Monitoramento" title="Período de acompanhamento" description="Veja o status do plano e acompanhe cada envio do WhatsApp no calendário mensal." />
    {active ? <section className="dashboard-grid"><Card className="overview-card"><span className="badge">📡 Plano ativo</span><h2>{active.name ?? `Plano #${active.id}`}</h2><p className="muted">Status: {active.status ?? (active.active ? 'active' : 'inactive')}</p></Card><MetricCard label="Início" value={active.starts_at ?? '—'} /><MetricCard label="Término" value={active.ends_at ?? '—'} /><MetricCard label="Respondidos" value={answered} /></section> : <EmptyState title="Monitoramento ainda não iniciado" />}
    <section className="calendar-layout"><Card className="calendar-card"><h2>Calendário mensal</h2><div className="calendar">{days.map((day) => { const report = byDate.get(day); const current = state(report); return <button className={`day ${current.className} ${selected?.report_date === day ? 'is-active' : ''}`} key={day} type="button" onClick={() => setSelected(report)}><strong>{new Date(`${day}T00:00:00`).getDate()}</strong><span>{current.label}</span></button>; })}</div></Card><Card className="detail-card"><h2>Ações do dia</h2>{selected ? <div className="stack"><StatusBadge status={selected.status} /><p><strong>Data:</strong> {selected.report_date}</p><p className="muted">Para visualizar, editar ou excluir respostas enviadas pelo WhatsApp, use a página Calendário.</p><a className="button secondary" href="/patient/calendar">Abrir respostas do dia</a></div> : <p className="muted">Selecione um dia respondido, não respondido ou incompleto para ver detalhes.</p>}</Card></section>
  </>;
}
