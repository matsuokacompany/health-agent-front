'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button, Card, MetricCard, PageHeader } from '@/components/ui/design';
import { StatusBadge } from '@/components/ui/badges';
import { CalendarSkeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import type { DailyReport } from '@/lib/types';
import { dailyReportsApi } from '@/services/dailyReports';

function toDateKey(date: Date) { return date.toISOString().slice(0, 10); }
function reportState(report?: DailyReport) { if (!report) return { label: 'Pendente', className: 'is-pending', icon: '○' }; if (report.status === 'COMPLETED' || report.completed) return { label: 'Respondido', className: 'is-complete', icon: '✓' }; if (report.status === 'EXPIRED') return { label: 'Expirado', className: 'is-issue', icon: '!' }; return { label: 'Revisar', className: 'is-issue', icon: '…' }; }

export default function Calendar() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [selected, setSelected] = useState<DailyReport | undefined>();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    dailyReportsApi.list().then((items) => {
      if (!mounted) return;
      setReports(items);
      setSelected(items[0]);
    }).catch(() => setReports([])).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const byDate = useMemo(() => new Map(reports.filter((report) => report.report_date).map((report) => [report.report_date, report])), [reports]);
  const days = useMemo(() => Array.from({ length: 35 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (34 - index)); return toDateKey(date); }), []);
  const answered = reports.filter((report) => report.status === 'COMPLETED' || report.completed).length;
  const issues = reports.filter((report) => report.status === 'EXPIRED' || report.status === 'AWAITING_CAUSE' || report.status === 'AWAITING_SYMPTOM_DESCRIPTION').length;

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await dailyReportsApi.update(selected.id, {
        symptom_description: String(form.get('symptom_description') ?? ''),
        cause: String(form.get('cause') ?? ''),
        had_symptoms: form.get('had_symptoms') === 'yes',
      });
      setReports((current) => current.map((report) => report.id === updated.id ? updated : report));
      setSelected(updated);
      setEditing(false);
      setFeedback('Resposta atualizada com segurança.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível salvar a correção.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteSelected() {
    if (!selected) return;
    setSaving(true);
    setFeedback(null);
    try {
      await dailyReportsApi.remove(selected.id);
      setReports((current) => current.filter((report) => report.id !== selected.id));
      setSelected(undefined);
      setDeleting(false);
      setFeedback('Resposta removida. Você poderá reenviar pelo WhatsApp quando o bot solicitar novamente.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível remover a resposta.');
    } finally {
      setSaving(false);
    }
  }

  return <><PageHeader eyebrow="Calendário clínico" title="Check-ins do WhatsApp" description="Acompanhe o histórico enviado pelo bot. Se uma resposta saiu errada, selecione o dia para editar ou apagar antes da revisão da equipe." action={<Button href="/patient/dashboard" variant="secondary">← Resumo</Button>} />
    <section className="dashboard-grid"><Card className="overview-card"><span className="badge">🗓️ Calendário</span><h2>Últimos 35 dias</h2><p className="muted">Cores e ícones indicam dias respondidos, pendentes ou que precisam de correção.</p></Card><MetricCard label="Respondidos" value={answered} /><MetricCard label="Recebidos" value={reports.length} /><MetricCard label="Para revisar" value={issues} /></section>
    {feedback ? <p className={feedback.includes('não') || feedback.includes('Não') ? 'notice danger' : 'notice success'}>{feedback}</p> : null}
    {loading ? <CalendarSkeleton /> : <section className="calendar-layout"><Card className="calendar-card"><div className="calendar-weekdays"><span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span></div><div className="calendar">{days.map((day) => { const report = byDate.get(day); const state = reportState(report); return <button className={`day ${state.className} ${selected?.report_date === day ? 'is-active' : ''}`} key={day} onClick={() => setSelected(report)} type="button"><strong>{new Date(`${day}T00:00:00`).getDate()}</strong><span>{state.icon} {state.label}</span></button>; })}</div></Card>
    <Card className="detail-card"><span className="badge">📌 Detalhes</span><h2>Resposta selecionada</h2>{selected ? <div className="stack"><StatusBadge status={selected.status} /><p><strong>Data:</strong> {selected.report_date}</p><p><strong>Sintomas:</strong> {selected.had_symptoms ? 'Sim' : 'Não informado ou ausente'}</p><p><strong>Descrição:</strong> <span className="muted">{selected.symptom_description ?? 'Nenhuma descrição enviada.'}</span></p>{selected.cause ? <p><strong>Causa:</strong> <span className="muted">{selected.cause}</span></p> : null}<div className="page-actions"><button className="button secondary" type="button" onClick={() => setEditing(true)}>✏️ Editar resposta</button><button className="button ghost danger-button" type="button" onClick={() => setDeleting(true)}>🗑️ Apagar envio</button></div></div> : <p className="muted">Selecione um dia respondido para visualizar, editar ou apagar o envio do WhatsApp.</p>}</Card></section>}
    <Modal open={editing} title="Corrigir resposta do WhatsApp" onClose={() => setEditing(false)}>{selected ? <form className="stack" onSubmit={submitEdit}><label>Sintomas<select name="had_symptoms" defaultValue={selected.had_symptoms ? 'yes' : 'no'}><option value="no">Não</option><option value="yes">Sim</option></select></label><label>Descrição enviada<textarea name="symptom_description" rows={5} defaultValue={selected.symptom_description ?? ''} placeholder="Corrija o texto enviado pelo bot" /></label><label>Causa ou contexto<textarea name="cause" rows={3} defaultValue={selected.cause ?? ''} placeholder="Ex.: medicação, alimentação, atividade física..." /></label><div className="page-actions"><button className="button secondary" type="button" onClick={() => setEditing(false)}>Cancelar</button><button className="button" disabled={saving} type="submit">{saving ? 'Salvando...' : 'Salvar correção'}</button></div></form> : null}</Modal>
    <Modal open={deleting} title="Apagar envio do WhatsApp" onClose={() => setDeleting(false)}><p className="muted">Essa ação remove a resposta selecionada do calendário. Use apenas quando a mensagem enviada ao bot estiver incorreta.</p><div className="page-actions"><button className="button secondary" type="button" onClick={() => setDeleting(false)}>Cancelar</button><button className="button danger-button" disabled={saving} type="button" onClick={deleteSelected}>{saving ? 'Apagando...' : 'Apagar resposta'}</button></div></Modal>
  </>;
}
