'use client';

import { FormEvent, useMemo, useState } from 'react';
import { usePatientData } from '@/components/patient/PatientDataProvider';
import { Card, MetricCard, PageHeader } from '@/components/ui/design';
import { StatusBadge } from '@/components/ui/badges';
import { EmptyState } from '@/components/ui/states';
import { Modal } from '@/components/ui/Modal';
import { dailyReportsApi } from '@/services/dailyReports';
import { createMockMonitoringSummary, createMockMonthlyMonitoringCalendar, type MonitoringCalendarDay } from '@/services/patientMonitoring';

export default function PatientMonitoring() {
  const { plans, reports, updateReport, removeReport } = usePatientData();
  const [selectedDate, setSelectedDate] = useState<string>();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const active = plans.find((plan) => plan.active || plan.status === 'active') ?? plans[0];
  const summary = createMockMonitoringSummary(active);
  const days = useMemo(() => createMockMonthlyMonitoringCalendar(reports), [reports]);
  const selected = useMemo<MonitoringCalendarDay | undefined>(() => days.find((day) => day.date === selectedDate), [days, selectedDate]);
  const answered = reports.filter((report) => report.status === 'COMPLETED' || report.completed).length;

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected?.report) return;
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await dailyReportsApi.update(selected.report.id, {
        symptom_description: String(form.get('symptom_description') ?? ''),
        cause: String(form.get('cause') ?? ''),
        had_symptoms: form.get('had_symptoms') === 'yes',
      });
      updateReport(updated);
      setEditing(false);
      setFeedback('Resposta atualizada.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível atualizar a resposta.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteReport() {
    if (!selected?.report) return;
    setSaving(true);
    setFeedback(null);
    try {
      await dailyReportsApi.remove(selected.report.id);
      removeReport(selected.report.id);
      setDeleting(false);
      setFeedback('Resposta excluída do monitoramento.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível excluir a resposta.');
    } finally {
      setSaving(false);
    }
  }

  return <><PageHeader eyebrow="Monitoramento" title="Período de acompanhamento" description="Veja o status do plano e acompanhe cada envio do WhatsApp no calendário mensal." />
    {active ? <section className="dashboard-grid"><Card className="overview-card"><span className="badge">📡 Plano ativo</span><h2>{active.name ?? `Plano #${active.id}`}</h2><p className="muted">Status: {summary.status}</p></Card><MetricCard label="Data de início" value={summary.startsAt ?? '—'} /><MetricCard label="Data de término" value={summary.endsAt ?? '—'} /><MetricCard label="Status" value={summary.status} /><MetricCard label="Respondidos" value={answered} /></section> : <EmptyState title="Monitoramento ainda não iniciado" />}
    {feedback ? <p className={feedback.includes('não') || feedback.includes('Não') ? 'notice danger' : 'notice success'}>{feedback}</p> : null}
    <section className="calendar-layout"><Card className="calendar-card"><h2>Calendário mensal</h2><div className="calendar">{days.map((day) => <button className={`day ${day.className} ${selected?.date === day.date ? 'is-active' : ''}`} key={day.date} type="button" onClick={() => setSelectedDate(day.date)}><strong>{new Date(`${day.date}T00:00:00`).getDate()}</strong><span>{day.status}</span></button>)}</div></Card><Card className="detail-card"><h2>Ações do dia</h2>{selected ? <div className="stack"><span className="badge">{selected.status}</span><p><strong>Data:</strong> {selected.date}</p>{selected.report ? <><StatusBadge status={selected.report.status} /><p><strong>Sintomas:</strong> {selected.report.had_symptoms ? 'Sim' : 'Não'}</p><p className="muted">{selected.report.symptom_description ?? 'Sem descrição enviada.'}</p>{selected.report.cause ? <p><strong>Causa:</strong> {selected.report.cause}</p> : null}<div className="page-actions"><button className="button secondary" type="button" onClick={() => setEditing(true)}>✏️ Editar resposta</button><button className="button danger-button" type="button" onClick={() => setDeleting(true)}>🗑️ Excluir resposta</button></div></> : <p className="muted">Este dia está como “{selected.status}” e não possui resposta para visualizar, editar ou excluir.</p>}</div> : <p className="muted">Selecione um dia do calendário para visualizar respostas e ações disponíveis.</p>}</Card></section>
    <Modal open={editing} title="Editar resposta do monitoramento" onClose={() => setEditing(false)}>{selected?.report ? <form className="stack" onSubmit={submitEdit}><label>Sintomas<select name="had_symptoms" defaultValue={selected.report.had_symptoms ? 'yes' : 'no'}><option value="no">Não</option><option value="yes">Sim</option></select></label><label>Descrição<textarea name="symptom_description" rows={5} defaultValue={selected.report.symptom_description ?? ''} /></label><label>Causa<textarea name="cause" rows={3} defaultValue={selected.report.cause ?? ''} /></label><div className="page-actions"><button className="button secondary" type="button" onClick={() => setEditing(false)}>Cancelar</button><button className="button" disabled={saving} type="submit">{saving ? 'Salvando...' : 'Salvar resposta'}</button></div></form> : null}</Modal>
    <Modal open={deleting} title="Excluir resposta" onClose={() => setDeleting(false)}><p className="muted">Confirme para excluir a resposta selecionada do calendário mensal.</p><div className="page-actions"><button className="button secondary" type="button" onClick={() => setDeleting(false)}>Cancelar</button><button className="button danger-button" disabled={saving} type="button" onClick={deleteReport}>{saving ? 'Excluindo...' : 'Excluir resposta'}</button></div></Modal>
  </>;
}
