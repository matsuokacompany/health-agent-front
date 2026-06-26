'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, MetricCard, PageHeader } from '@/components/ui/design';
import { StatusBadge } from '@/components/ui/badges';
import type { DailyReport } from '@/lib/types';
import { dailyReportsApi } from '@/services/dailyReports';

function toDateKey(date: Date) { return date.toISOString().slice(0, 10); }
function reportState(report?: DailyReport) { if (!report) return { label: 'Pendente', className: 'is-pending' }; if (report.status === 'COMPLETED' || report.completed) return { label: 'Respondido', className: 'is-complete' }; if (report.status === 'EXPIRED') return { label: 'Incompleto', className: 'is-issue' }; return { label: 'Pendente', className: 'is-pending' }; }

export default function Calendar() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [selected, setSelected] = useState<DailyReport | undefined>();
  useEffect(() => { dailyReportsApi.list().then((items) => { setReports(items); setSelected(items[0]); }).catch(() => setReports([])); }, []);
  const byDate = useMemo(() => new Map(reports.map((report) => [report.report_date, report])), [reports]);
  const days = useMemo(() => Array.from({ length: 28 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (27 - index)); return toDateKey(date); }), []);
  const answered = reports.filter((report) => report.status === 'COMPLETED' || report.completed).length;
  const issues = reports.filter((report) => report.status === 'EXPIRED' || report.status === 'AWAITING_CAUSE' || report.status === 'AWAITING_SYMPTOM_DESCRIPTION').length;

  return <><PageHeader eyebrow="Calendário clínico" title="Check-ins" description="Revise os dias respondidos, pendentes e com respostas incorretas ou incompletas. Selecione um dia para ver os detalhes." action={<Button href="/patient/dashboard" variant="secondary">Voltar ao resumo</Button>} />
    <section className="grid priority-grid"><MetricCard label="Respondidos" value={answered} /><MetricCard label="Recebidos" value={reports.length} /><MetricCard label="Incompletos" value={issues} /></section>
    <section className="calendar-layout"><Card className="calendar-card"><div className="calendar-weekdays"><span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span></div><div className="calendar">{days.map((day) => { const report = byDate.get(day); const state = reportState(report); return <button className={`day ${state.className} ${selected?.report_date === day ? 'is-active' : ''}`} key={day} onClick={() => setSelected(report)} type="button"><strong>{new Date(`${day}T00:00:00`).getDate()}</strong><span>{state.label}</span></button>; })}</div></Card>
    <Card><h2>Detalhes do dia</h2>{selected ? <div className="stack"><StatusBadge status={selected.status} /><p><strong>Data:</strong> {selected.report_date}</p><p><strong>Sintomas:</strong> {selected.had_symptoms ? 'Sim' : 'Não informado ou ausente'}</p><p className="muted">{selected.symptom_description ?? 'Nenhuma descrição enviada.'}</p>{selected.status !== 'COMPLETED' ? <Button href={`/app/monitoramento`} variant="secondary">Editar quando permitido</Button> : null}</div> : <p className="muted">Selecione um dia com check-in para visualizar a resposta enviada.</p>}</Card></section>
  </>;
}
