'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { useI18n } from '@/components/i18n/I18nProvider';
import { Card, MetricCard } from '@/components/ui/design';
import { EmptyState } from '@/components/ui/states';
import { Modal } from '@/components/ui/Modal';
import { CalendarSkeleton } from '@/components/ui/Skeleton';
import { dailyReportsApi } from '@/services/dailyReports';
import { patientDashboardApi, type PatientDashboardCalendarDay, type PatientDashboardOverview } from '@/services/patientDashboard';
import { addMonths } from '@/services/patientMonitoring';
import type { DailyReport } from '@/lib/types';

type EditFormState = { had_symptoms: boolean; symptom_description: string; suspected_cause: string };

const formatNullableDate = (value?: string | null) => value?.slice(0, 10) || '—';
const firstOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const reportIdFromCheckIn = (checkin: PatientDashboardCalendarDay['checkins'][number]) => Number(checkin.id);

function getDayStatus(day: PatientDashboardCalendarDay) {
  if (!day.has_checkin) return 'noCheckIn';
  if (day.completed) return 'answered';
  if (day.pending) return 'unanswered';
  return 'incomplete';
}

function getDayClassName(day: PatientDashboardCalendarDay) {
  if (!day.has_checkin) return 'is-empty';
  if (day.completed) return day.has_symptoms ? 'is-symptom' : 'is-complete';
  if (day.pending) return 'is-pending';
  return 'is-issue';
}

function monitoringErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 404) return 'Resposta não encontrada ou não pertence ao usuário atual.';
    if (error.status === 401 || error.status === 403) return 'Sessão expirada. Faça login novamente.';
  }
  return 'Não foi possível atualizar sua resposta. Tente novamente.';
}

function normalizeEditForm(report: DailyReport): EditFormState {
  return {
    had_symptoms: Boolean(report.had_symptoms),
    symptom_description: String(report.symptom_description ?? ''),
    suspected_cause: String(report.suspected_cause ?? report.cause ?? ''),
  };
}

export default function PatientMonitoring() {
  const { t, raw, locale } = useI18n();
  const [visibleMonth, setVisibleMonth] = useState(() => firstOfMonth(new Date()));
  const [overview, setOverview] = useState<PatientDashboardOverview | null>(null);
  const [days, setDays] = useState<PatientDashboardCalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>();
  const [selectedCheckin, setSelectedCheckin] = useState<PatientDashboardCalendarDay['checkins'][number] | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({ had_symptoms: false, symptom_description: '', suspected_cause: '' });

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth() + 1;
  const weekdays = raw<string[]>('monitoring.weekdays');
  const selected = useMemo(() => days.find((day) => day.date === selectedDate), [days, selectedDate]);
  const activePlan = overview?.activePlan;
  const canGoPrevious = true;
  const canGoNext = true;

  const loadDashboard = useCallback(async () => {
    const [nextOverview, calendar] = await Promise.all([
      patientDashboardApi.getOverview(),
      patientDashboardApi.getCalendar(year, month),
    ]);
    setOverview(nextOverview);
    setDays(calendar.days);
  }, [month, year]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setFeedback(null);
    loadDashboard().catch((error) => {
      if (mounted) setFeedback(monitoringErrorMessage(error));
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [loadDashboard]);

  useEffect(() => { setSelectedDate(undefined); setSelectedCheckin(null); }, [month, year]);
  useEffect(() => { setSelectedCheckin(selected?.checkins?.[0] ?? null); }, [selected]);

  async function openEditModal(checkin: PatientDashboardCalendarDay['checkins'][number]) {
    setSaving(true); setFeedback(null);
    try {
      const report = await dailyReportsApi.get(reportIdFromCheckIn(checkin));
      setEditForm(normalizeEditForm(report));
      setSelectedCheckin(checkin);
      setEditing(true);
    } catch (error) {
      setFeedback(monitoringErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCheckin) return;
    setSaving(true); setFeedback(null);
    try {
      const payload = editForm.had_symptoms
        ? { had_symptoms: true, symptom_description: editForm.symptom_description, suspected_cause: editForm.suspected_cause }
        : { had_symptoms: false };
      await dailyReportsApi.update(reportIdFromCheckIn(selectedCheckin), payload);
      setEditing(false);
      await loadDashboard();
      setFeedback(t('monitoring.answerUpdated'));
    } catch (error) {
      setFeedback(monitoringErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function deleteResponse() {
    if (!selectedCheckin) return;
    setSaving(true); setFeedback(null);
    try {
      await dailyReportsApi.removeResponse(reportIdFromCheckIn(selectedCheckin));
      setDeleting(false);
      setEditing(false);
      await loadDashboard();
      setFeedback(t('monitoring.answerDeleted'));
    } catch (error) {
      setFeedback(monitoringErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const monthLocale = locale === 'es' ? 'es-ES' : locale === 'pt-BR' ? 'pt-BR' : 'en-US';
  const monthLabel = visibleMonth.toLocaleDateString(monthLocale, { month: 'long', year: 'numeric' });
  const statusLabel = (status: string) => t(`monitoring.statuses.${status}`);
  const answered = overview?.statistics.find((item) => item.label.toLowerCase() === 'answered')?.value ?? 0;
  const hasMonitoring = Boolean(activePlan);

  return <>
    {hasMonitoring ? <section className="dashboard-grid"><Card className="overview-card"><span className="badge">{t('monitoring.activePlan')}</span><h2>{activePlan?.name ?? t('monitoring.defaultPlanName')}</h2><p className="muted">{t('monitoring.startsAt')}: {formatNullableDate(activePlan?.starts_at)} • {t('monitoring.endsAt')}: {formatNullableDate(activePlan?.ends_at)}</p></Card><MetricCard label={t('monitoring.startsAt')} value={formatNullableDate(activePlan?.starts_at)} /><MetricCard label={t('monitoring.endsAt')} value={formatNullableDate(activePlan?.ends_at)} /><MetricCard label={t('monitoring.answered')} value={answered} /></section> : <EmptyState title={t('monitoring.notStarted')} />}
    {feedback ? <p className={feedback.toLowerCase().includes('não') || feedback.toLowerCase().includes('expirada') ? 'notice danger' : 'notice success'}>{feedback}</p> : null}
    {loading ? <CalendarSkeleton /> : <section className="calendar-layout"><Card className="calendar-card"><div className="calendar-header"><div><h2>{t('monitoring.monthlyCalendar')}</h2><p className="muted compact">{monthLabel}</p></div><div className="calendar-nav"><button className="button secondary icon-control" type="button" aria-label={t('monitoring.previousMonth')} disabled={!canGoPrevious} onClick={() => setVisibleMonth((current) => addMonths(current, -1))}>‹</button><button className="button secondary icon-control" type="button" aria-label={t('monitoring.nextMonth')} disabled={!canGoNext} onClick={() => setVisibleMonth((current) => addMonths(current, 1))}>›</button></div></div><div className="calendar-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div><div className="calendar">{days.map((day) => { const status = getDayStatus(day); return <button className={`day ${getDayClassName(day)} ${selected?.date === day.date ? 'is-active' : ''}`} key={day.date} type="button" onClick={() => setSelectedDate(day.date)}><strong>{new Date(`${day.date}T00:00:00`).getDate()}</strong><span>{statusLabel(status)}</span></button>; })}</div><div className="calendar-legend" aria-label="Legenda do calendário"><span><i className="legend-complete" />Respondido sem sintomas</span><span><i className="legend-symptom" />Respondido com sintomas</span><span><i className="legend-pending" />Não respondido</span><span><i className="legend-empty" />Sem check-in</span></div></Card><Card className="detail-card"><h2>{t('monitoring.dayActions')}</h2>{selected ? <div className="stack">{selected.checkins.length ? selected.checkins.map((checkin) => <div className="checkin-detail" key={checkin.id}><p><strong>{t('monitoring.symptoms')}:</strong> {checkin.had_symptoms ? t('monitoring.yes') : t('monitoring.no')}</p>{checkin.symptom_description ? <p><strong>{t('monitoring.descriptionLabel')}:</strong> {checkin.symptom_description}</p> : <p className="muted">{t('monitoring.noDescription')}</p>}{(checkin.suspected_cause ?? checkin.cause) ? <p><strong>{t('monitoring.cause')}:</strong> {checkin.suspected_cause ?? checkin.cause}</p> : null}<div className="page-actions"><button className="button secondary" disabled={saving} type="button" onClick={() => openEditModal(checkin)}>{t('monitoring.editAnswer')}</button><button className="button danger-button" type="button" onClick={() => { setSelectedCheckin(checkin); setDeleting(true); }}>{t('monitoring.deleteAnswer')}</button></div></div>) : <p className="muted">{t('monitoring.noReportForDay', { status: statusLabel(getDayStatus(selected)) })}</p>}</div> : <p className="muted">{t('monitoring.selectDay')}</p>}</Card></section>}
    <Modal open={editing} title={t('monitoring.editTitle')} onClose={() => setEditing(false)}>{selectedCheckin ? <form className="stack" onSubmit={submitEdit}><label>{t('monitoring.symptoms')}<select name="had_symptoms" value={editForm.had_symptoms ? 'yes' : 'no'} onChange={(event) => setEditForm((current) => ({ ...current, had_symptoms: event.target.value === 'yes' }))}><option value="no">{t('monitoring.no')}</option><option value="yes">{t('monitoring.yes')}</option></select></label>{editForm.had_symptoms ? <><label>{t('monitoring.descriptionLabel')}<textarea name="symptom_description" rows={5} value={editForm.symptom_description} onChange={(event) => setEditForm((current) => ({ ...current, symptom_description: event.target.value }))} /></label><label>{t('monitoring.cause')}<textarea name="suspected_cause" rows={3} value={editForm.suspected_cause} onChange={(event) => setEditForm((current) => ({ ...current, suspected_cause: event.target.value }))} /></label></> : null}<div className="page-actions"><button className="button secondary" type="button" onClick={() => setEditing(false)}>{t('monitoring.cancel')}</button><button className="button" disabled={saving} type="submit">{saving ? t('monitoring.saving') : t('monitoring.saveAnswer')}</button></div></form> : null}</Modal>
    <Modal open={deleting} title={t('monitoring.deleteTitle')} onClose={() => setDeleting(false)}><p className="muted">{t('monitoring.deleteConfirm')}</p><div className="page-actions"><button className="button secondary" type="button" onClick={() => setDeleting(false)}>{t('monitoring.cancel')}</button><button className="button danger-button" disabled={saving} type="button" onClick={deleteResponse}>{saving ? t('monitoring.deleting') : t('monitoring.deleteTitle')}</button></div></Modal>
  </>;
}
