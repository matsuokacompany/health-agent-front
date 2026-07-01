'use client';
import { toFriendlyErrorMessage } from '@/components/ui/errors';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';
import { usePatientData } from '@/components/patient/PatientDataProvider';
import { Card, MetricCard, PageHeader } from '@/components/ui/design';
import { StatusBadge } from '@/components/ui/badges';
import { EmptyState } from '@/components/ui/states';
import { Modal } from '@/components/ui/Modal';
import { CalendarSkeleton } from '@/components/ui/Skeleton';
import { dailyReportsApi } from '@/services/dailyReports';
import { addMonths, compareMonths, createMockMonitoringSummary, createMockMonthlyMonitoringCalendar, getMonitoringMonthRange, monthKey, type MonitoringCalendarDay } from '@/services/patientMonitoring';

export default function PatientMonitoring() {
  const { t, raw, locale } = useI18n();
  const { plans, reports, loading, updateReport, removeReport } = usePatientData();
  const [selectedDate, setSelectedDate] = useState<string>();
  const [visibleMonth, setVisibleMonth] = useState<Date>();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const active = plans.find((plan) => plan.active || plan.status === 'active') ?? plans[0];
  const summary = createMockMonitoringSummary(active);
  const monthRange = useMemo(() => getMonitoringMonthRange(active), [active]);
  const currentMonth = visibleMonth ?? monthRange.start;
  const monthReports = useMemo(() => reports.filter((report) => report.report_date?.startsWith(monthKey(currentMonth))), [currentMonth, reports]);
  const days = useMemo(() => createMockMonthlyMonitoringCalendar(monthReports, currentMonth), [currentMonth, monthReports]);
  const selected = useMemo<MonitoringCalendarDay | undefined>(() => days.find((day) => day.date === selectedDate), [days, selectedDate]);
  const answered = reports.filter((report) => report.status === 'COMPLETED' || report.completed).length;
  const canGoPrevious = compareMonths(currentMonth, monthRange.start) > 0;
  const canGoNext = compareMonths(currentMonth, monthRange.end) < 0;
  const weekdays = raw<string[]>('monitoring.weekdays');

  useEffect(() => { setVisibleMonth(monthRange.start); setSelectedDate(undefined); }, [active?.id, monthRange.start.getFullYear(), monthRange.start.getMonth()]);
  useEffect(() => { setSelectedDate(undefined); }, [currentMonth.getFullYear(), currentMonth.getMonth()]);

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected?.report) return;
    const form = new FormData(event.currentTarget);
    setSaving(true); setFeedback(null);
    try {
      const updated = await dailyReportsApi.update(selected.report.id, { symptom_description: String(form.get('symptom_description') ?? ''), cause: String(form.get('cause') ?? ''), had_symptoms: form.get('had_symptoms') === 'yes' });
      updateReport(updated); setEditing(false); setFeedback(t('monitoring.answerUpdated'));
    } catch (error) { setFeedback(toFriendlyErrorMessage(error)); } finally { setSaving(false); }
  }

  async function deleteReport() {
    if (!selected?.report) return;
    setSaving(true); setFeedback(null);
    try { await dailyReportsApi.remove(selected.report.id); removeReport(selected.report.id); setDeleting(false); setFeedback(t('monitoring.answerDeleted')); } catch (error) { setFeedback(toFriendlyErrorMessage(error)); } finally { setSaving(false); }
  }

  const monthLabel = currentMonth.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' });
  const statusLabel = (status: MonitoringCalendarDay['status']) => t(`monitoring.statuses.${status}`);

  return <><PageHeader eyebrow={t('monitoring.eyebrow')} title={t('monitoring.title')} description={t('monitoring.description')} />
    {active ? <section className="dashboard-grid"><Card className="overview-card"><span className="badge">{t('monitoring.activePlan')}</span><h2>{active.name ?? t('monitoring.defaultPlanName')}</h2><p className="muted">{t('monitoring.status')}: {summary.status}</p></Card><MetricCard label={t('monitoring.startsAt')} value={summary.startsAt ?? '—'} /><MetricCard label={t('monitoring.endsAt')} value={summary.endsAt ?? '—'} /><MetricCard label={t('monitoring.status')} value={summary.status} /><MetricCard label={t('monitoring.answered')} value={answered} /></section> : <EmptyState title={t('monitoring.notStarted')} />}
    {feedback ? <p className={feedback.toLowerCase().includes('não') || feedback.toLowerCase().includes('no ') ? 'notice danger' : 'notice success'}>{feedback}</p> : null}
    {loading ? <CalendarSkeleton /> : <section className="calendar-layout"><Card className="calendar-card"><div className="calendar-header"><div><h2>{t('monitoring.monthlyCalendar')}</h2><p className="muted compact">{monthLabel}</p></div><div className="calendar-nav"><button className="button secondary icon-control" type="button" aria-label={t('monitoring.previousMonth')} disabled={!canGoPrevious} onClick={() => setVisibleMonth((month) => addMonths(month ?? currentMonth, -1))}>‹</button><button className="button secondary icon-control" type="button" aria-label={t('monitoring.nextMonth')} disabled={!canGoNext} onClick={() => setVisibleMonth((month) => addMonths(month ?? currentMonth, 1))}>›</button></div></div><div className="calendar-weekdays">{weekdays.map((day) => <span key={day}>{day}</span>)}</div><div className="calendar">{days.map((day) => <button className={`day ${day.className} ${selected?.date === day.date ? 'is-active' : ''}`} key={day.date} type="button" onClick={() => setSelectedDate(day.date)}><strong>{new Date(`${day.date}T00:00:00`).getDate()}</strong><span>{statusLabel(day.status)}</span></button>)}</div></Card><Card className="detail-card"><h2>{t('monitoring.dayActions')}</h2>{selected ? <div className="stack"><span className="badge">{statusLabel(selected.status)}</span><p><strong>{t('monitoring.date')}:</strong> {selected.date}</p>{selected.report ? <><StatusBadge status={selected.report.status} /><p><strong>{t('monitoring.symptoms')}:</strong> {selected.report.had_symptoms ? t('monitoring.yes') : t('monitoring.no')}</p><p className="muted">{selected.report.symptom_description ?? t('monitoring.noDescription')}</p>{selected.report.cause ? <p><strong>{t('monitoring.cause')}:</strong> {selected.report.cause}</p> : null}<div className="page-actions"><button className="button secondary" type="button" onClick={() => setEditing(true)}>{t('monitoring.editAnswer')}</button><button className="button danger-button" type="button" onClick={() => setDeleting(true)}>{t('monitoring.deleteAnswer')}</button></div></> : <p className="muted">{t('monitoring.noReportForDay', { status: statusLabel(selected.status) })}</p>}</div> : <p className="muted">{t('monitoring.selectDay')}</p>}</Card></section>}
    <Modal open={editing} title={t('monitoring.editTitle')} onClose={() => setEditing(false)}>{selected?.report ? <form className="stack" onSubmit={submitEdit}><label>{t('monitoring.symptoms')}<select name="had_symptoms" defaultValue={selected.report.had_symptoms ? 'yes' : 'no'}><option value="no">{t('monitoring.no')}</option><option value="yes">{t('monitoring.yes')}</option></select></label><label>{t('monitoring.descriptionLabel')}<textarea name="symptom_description" rows={5} defaultValue={selected.report.symptom_description ?? ''} /></label><label>{t('monitoring.cause')}<textarea name="cause" rows={3} defaultValue={selected.report.cause ?? ''} /></label><div className="page-actions"><button className="button secondary" type="button" onClick={() => setEditing(false)}>{t('monitoring.cancel')}</button><button className="button" disabled={saving} type="submit">{saving ? t('monitoring.saving') : t('monitoring.saveAnswer')}</button></div></form> : null}</Modal>
    <Modal open={deleting} title={t('monitoring.deleteTitle')} onClose={() => setDeleting(false)}><p className="muted">{t('monitoring.deleteConfirm')}</p><div className="page-actions"><button className="button secondary" type="button" onClick={() => setDeleting(false)}>{t('monitoring.cancel')}</button><button className="button danger-button" disabled={saving} type="button" onClick={deleteReport}>{saving ? t('monitoring.deleting') : t('monitoring.deleteTitle')}</button></div></Modal>
  </>;
}
