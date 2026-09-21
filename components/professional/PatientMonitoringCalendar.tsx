'use client';

import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/design';
import { Modal } from '@/components/ui/Modal';
import { CalendarSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/states';
import { useProfessionalCalendar } from '@/hooks/useProfessional';
import type { ProfessionalCalendarCheckin, ProfessionalCalendarDay } from '@/services/professional';
import { SensitivePlaceholder } from '@/components/professional/SensitivePlaceholder';

type CalendarCell = { type: 'empty'; key: string } | { type: 'day'; day: ProfessionalCalendarDay };

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function firstOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function addMonths(date: Date, amount: number) { return new Date(date.getFullYear(), date.getMonth() + amount, 1); }
function formatDateLong(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR', { dateStyle: 'long' }); }
function isToday(dateKey: string) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return dateKey === todayKey;
}

function getDayStatus(day: ProfessionalCalendarDay) {
  if (!day.has_checkin) return 'Sem check-in';
  if (day.completed) return day.has_symptoms ? 'Com sintomas' : 'Sem sintomas';
  if (day.pending) return 'Não respondido';
  return 'Incompleto';
}
function getDayClassName(day: ProfessionalCalendarDay) {
  if (!day.has_checkin) return 'is-empty';
  if (day.completed) return day.has_symptoms ? 'is-symptom' : 'is-complete';
  if (day.pending) return 'is-pending';
  return 'is-issue';
}

function CheckinDetail({ checkin, revealSensitive }: { checkin: ProfessionalCalendarCheckin; revealSensitive: boolean }) {
  const completed = Boolean(checkin.completed);
  return <div className="checkin-detail">
    <p><strong>Sintomas:</strong> {checkin.had_symptoms != null ? (checkin.had_symptoms ? 'Sim' : 'Não') : 'Aguardando resposta'}</p>
    {checkin.had_symptoms && checkin.symptom_description ? <p><strong>Descrição:</strong> {revealSensitive ? checkin.symptom_description : <SensitivePlaceholder label="Descrição oculta" />}</p> : null}
    {checkin.diet_adherence != null ? <p><strong>Dieta:</strong> {checkin.diet_adherence ? 'Sim' : 'Não'}</p> : null}
    {checkin.diet_adherence === false && checkin.lifestyle_notes ? <p><strong>O que comeu fora da dieta:</strong> {revealSensitive ? checkin.lifestyle_notes : <SensitivePlaceholder label="Relato oculto" />}</p> : null}
    {checkin.exercise_adherence != null ? <p><strong>Exercício:</strong> {checkin.exercise_adherence ? 'Sim' : 'Não'}</p> : null}
    {checkin.medication_adherence != null || checkin.medication_adherence_level ? (
      <p><strong>Medicação:</strong> {checkin.medication_adherence_level === 'PARTIAL' ? 'Parcial' : checkin.medication_adherence ? 'Sim' : 'Não'}</p>
    ) : null}
    {/* The check-in's own fields (above) show whatever the patient answered
        even if they never finished the flow -- only the calendar's day-level
        aggregate icons are gated on completion (see PatientMonitoringCalendar). */}
    {!completed ? <p className="muted">Check-in ainda não finalizado pelo paciente.</p> : null}
  </div>;
}

/** Read-only mirror of the patient's own Monitoramento calendar (see
 * app/(patient)/patient/monitoring/page.tsx) so a professional can see the
 * same adherence picture their patient sees. This component never mutates
 * anything -- it only reads from GET /api/professional/patients/{id}/calendar. */
export function PatientMonitoringCalendar({ patientId, revealSensitive = true }: { patientId: string; revealSensitive?: boolean }) {
  const [visibleMonth, setVisibleMonth] = useState(() => firstOfMonth(new Date()));
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth() + 1;
  const calendar = useProfessionalCalendar(patientId, year, month);
  const [selectedDate, setSelectedDate] = useState<string>();
  const [detailsOpen, setDetailsOpen] = useState(false);

  const days = useMemo(() => calendar.data?.days ?? [], [calendar.data]);
  const selected = useMemo(() => days.find((day) => day.date === selectedDate), [days, selectedDate]);
  const calendarCells = useMemo<CalendarCell[]>(() => {
    const offset = new Date(year, month - 1, 1).getDay();
    return [
      ...Array.from({ length: offset }, (_, index) => ({ type: 'empty' as const, key: `empty-${year}-${month}-${index}` })),
      ...days.map((day) => ({ type: 'day' as const, day })),
    ];
  }, [days, month, year]);
  const monthLabel = visibleMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  function openDayDetails(day: ProfessionalCalendarDay) {
    setSelectedDate(day.date);
    setDetailsOpen(true);
  }

  if (calendar.isLoading) return <CalendarSkeleton />;
  if (calendar.error) return <ErrorState message={(calendar.error as Error).message} />;

  return <section className="calendar-layout is-calendar-only">
    <Card className="calendar-card">
      <div className="calendar-header">
        <div><h2>Calendário de monitoramento</h2><p className="muted compact">{monthLabel}</p></div>
        <div className="calendar-nav">
          <button className="button secondary" type="button" onClick={() => setVisibleMonth(firstOfMonth(new Date()))}>Hoje</button>
          <button className="button secondary icon-control" type="button" aria-label="Mês anterior" onClick={() => setVisibleMonth((current) => addMonths(current, -1))}>‹</button>
          <button className="button secondary icon-control" type="button" aria-label="Próximo mês" onClick={() => setVisibleMonth((current) => addMonths(current, 1))}>›</button>
        </div>
      </div>
      <div className="calendar-weekdays">{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendar">
        {calendarCells.map((cell) => {
          if (cell.type === 'empty') return <span className="day calendar-empty-cell" aria-hidden="true" key={cell.key} />;
          const day = cell.day;
          const status = getDayStatus(day);
          const adherenceLabel = [day.diet_followed ? 'Dieta' : null, day.exercise_followed ? 'Exercício' : null, day.medication_taken ? 'Medicação' : null, day.medication_partial ? 'Medicação parcial' : null].filter(Boolean).join(', ');
          return <button
            className={`day ${getDayClassName(day)} ${selected?.date === day.date ? 'is-active' : ''} ${isToday(day.date) ? 'is-today' : ''}`}
            key={day.date}
            type="button"
            aria-label={`${formatDateLong(day.date)}: ${status}${adherenceLabel ? ` — ${adherenceLabel}` : ''}`}
            onClick={() => openDayDetails(day)}
          >
            <strong>{new Date(`${day.date}T00:00:00`).getDate()}</strong>
            <span>{status}</span>
            {day.diet_followed || day.exercise_followed || day.medication_taken || day.medication_partial ? (
              <span className="day-adherence-icons" aria-hidden="true">
                {day.diet_followed ? <span>🍎</span> : null}
                {day.exercise_followed ? <span>🏃</span> : null}
                {day.medication_taken ? <span>💊</span> : null}
                {day.medication_partial ? <span>🟡</span> : null}
              </span>
            ) : null}
          </button>;
        })}
      </div>
      <div className="calendar-legend" aria-label="Legenda">
        <div className="calendar-legend-group">
          <span className="calendar-legend-group-title">Status</span>
          <span><i className="legend-complete" />Respondido, sem sintomas</span>
          <span><i className="legend-symptom" />Respondido, com sintomas</span>
          <span><i className="legend-pending" />Não respondido</span>
          <span><i className="legend-issue" />Resposta incompleta</span>
          <span><i className="legend-empty" />Sem check-in</span>
        </div>
        <div className="calendar-legend-group">
          <span className="calendar-legend-group-title">Respostas</span>
          <span>🍎 Dieta</span>
          <span>🏃 Exercício</span>
          <span>💊 Medicação</span>
          <span>🟡 Medicação parcial</span>
        </div>
      </div>
    </Card>
    <Modal open={detailsOpen} title={selected ? formatDateLong(selected.date) : 'Detalhes do dia'} onClose={() => setDetailsOpen(false)}>
      {selected ? (
        selected.checkins.length
          ? <div className="stack">{selected.checkins.map((checkin) => <CheckinDetail checkin={checkin} revealSensitive={revealSensitive} key={checkin.id} />)}</div>
          : <p className="muted">Nenhum check-in registrado para {getDayStatus(selected).toLowerCase()} neste dia.</p>
      ) : null}
    </Modal>
  </section>;
}
