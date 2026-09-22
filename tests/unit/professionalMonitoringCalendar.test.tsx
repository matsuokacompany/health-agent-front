import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PatientMonitoringCalendar } from '@/components/professional/PatientMonitoringCalendar';

const useProfessionalCalendar = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useProfessional', () => ({ useProfessionalCalendar }));

const today = new Date();
const year = today.getFullYear();
const month = today.getMonth() + 1;
const isoDay = (day: number) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

function buildCalendar() {
  const daysInMonth = new Date(year, month, 0).getDate();
  return {
    year,
    month,
    days: Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      if (day === 5) {
        return {
          date: isoDay(day), has_checkin: true, completed: true, pending: false, has_symptoms: true,
          diet_followed: false, exercise_followed: false, medication_taken: false, medication_partial: false,
          statuses: ['COMPLETED'],
          checkins: [{
            id: 99, completed: true, had_symptoms: true, symptom_description: 'Dor lateral direita da pelve',
            diet_adherence: false, lifestyle_notes: 'Comi um pedaço de bolo no aniversário de um amigo',
            exercise_adherence: false, medication_adherence: false, medication_adherence_level: 'NONE',
          }],
        };
      }
      if (day === 6) {
        // Patient answered diet/exercise but the check-in expired before
        // medication -- completed=False AND pending=False (backend now only
        // sets pending when nothing at all was answered), which the day
        // status/class helpers must resolve to "Incompleto"/is-issue, not
        // "Não respondido".
        return {
          date: isoDay(day), has_checkin: true, completed: false, pending: false, has_symptoms: false,
          diet_followed: false, exercise_followed: false, medication_taken: false, medication_partial: false,
          statuses: ['EXPIRED'],
          checkins: [{ id: 100, completed: false, had_symptoms: false, diet_adherence: true, exercise_adherence: true, medication_adherence: null, medication_adherence_level: null }],
        };
      }
      if (day === 7) {
        // Genuinely untouched -- has_checkin=True but pending=True, the only
        // case that should still read as "Não respondido".
        return {
          date: isoDay(day), has_checkin: true, completed: false, pending: true, has_symptoms: false,
          diet_followed: false, exercise_followed: false, medication_taken: false, medication_partial: false,
          statuses: ['PENDING'],
          checkins: [{ id: 101, completed: false, had_symptoms: null, diet_adherence: null, exercise_adherence: null, medication_adherence: null, medication_adherence_level: null }],
        };
      }
      return { date: isoDay(day), has_checkin: false, completed: false, pending: false, has_symptoms: false, diet_followed: false, exercise_followed: false, medication_taken: false, medication_partial: false, statuses: [], checkins: [] };
    }),
  };
}

describe('calendário de monitoramento (visão do profissional, somente leitura)', () => {
  afterEach(cleanup);

  it('renderiza os dias do calendário do paciente e não expõe nenhuma ação de edição/exclusão', async () => {
    useProfessionalCalendar.mockReturnValue({ data: buildCalendar(), isLoading: false, error: null });
    render(<PatientMonitoringCalendar patientId="42" />);

    expect(useProfessionalCalendar).toHaveBeenCalledWith('42', year, month);
    expect(screen.getByText('Calendário de monitoramento')).toBeTruthy();

    // Open the day-detail modal for the day with a completed, symptomatic check-in.
    const dayButton = screen.getByRole('button', { name: /Com sintomas/ });
    fireEvent.click(dayButton);

    expect(await screen.findByText('Sintomas:')).toBeTruthy();
    // The symptom description and what the patient ate outside the diet
    // must show up here, not just the Sim/Não summary.
    expect(screen.getByText('Dor lateral direita da pelve')).toBeTruthy();
    expect(screen.getByText('Comi um pedaço de bolo no aniversário de um amigo')).toBeTruthy();
    // No edit/delete/answer affordance should ever render for a professional here --
    // this view is strictly GET-only, unlike the patient's own Monitoramento tab.
    expect(screen.queryByRole('button', { name: /editar/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /excluir/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /responder/i })).toBeNull();
  });

  it('oculta a descrição do sintoma e o relato da dieta quando revealSensitive é falso', async () => {
    useProfessionalCalendar.mockReturnValue({ data: buildCalendar(), isLoading: false, error: null });
    render(<PatientMonitoringCalendar patientId="42" revealSensitive={false} />);

    fireEvent.click(screen.getByRole('button', { name: /Com sintomas/ }));

    await screen.findByText('Sintomas:');
    expect(screen.queryByText('Dor lateral direita da pelve')).toBeNull();
    expect(screen.queryByText('Comi um pedaço de bolo no aniversário de um amigo')).toBeNull();
    expect(screen.getAllByText(/Descrição oculta|Relato oculto/).length).toBe(2);
  });

  it('distingue "Incompleto" (respondeu parte) de "Não respondido" (nada respondido)', async () => {
    useProfessionalCalendar.mockReturnValue({ data: buildCalendar(), isLoading: false, error: null });
    render(<PatientMonitoringCalendar patientId="42" />);

    const incompleteDay = screen.getByRole('button', { name: /Incompleto/ });
    expect(incompleteDay.className).toContain('is-issue');
    expect(screen.queryAllByRole('button', { name: /Não respondido/ }).length).toBeGreaterThan(0);

    fireEvent.click(incompleteDay);
    await screen.findByText('Check-in ainda não finalizado pelo paciente.');
    expect(screen.getAllByText('Sim')).toHaveLength(2); // Dieta: Sim, Exercício: Sim

    expect(screen.getByText('Resposta incompleta')).toBeTruthy();
  });

  it('colore os ícones de aderência (dieta/exercício/medicação) para leitura rápida no calendário', () => {
    // Regression: the Phosphor icons swapped in for the old colorful emoji
    // rendered with no explicit size and inherited the muted gray text
    // color -- effectively invisible at a glance. Each adherence icon must
    // carry its own color class so diet/exercise/medication/partial stay
    // instantly distinguishable.
    const day = 5;
    const calendar = {
      year, month,
      days: Array.from({ length: new Date(year, month, 0).getDate() }, (_, index) => {
        const current = index + 1;
        if (current === day) {
          return {
            date: isoDay(current), has_checkin: true, completed: true, pending: false, has_symptoms: false,
            diet_followed: true, exercise_followed: true, medication_taken: true, medication_partial: false,
            statuses: ['COMPLETED'],
            checkins: [{ id: 1, completed: true, had_symptoms: false, diet_adherence: true, exercise_adherence: true, medication_adherence: true, medication_adherence_level: 'ALL' }],
          };
        }
        return { date: isoDay(current), has_checkin: false, completed: false, pending: false, has_symptoms: false, diet_followed: false, exercise_followed: false, medication_taken: false, medication_partial: false, statuses: [], checkins: [] };
      }),
    };
    useProfessionalCalendar.mockReturnValue({ data: calendar, isLoading: false, error: null });
    render(<PatientMonitoringCalendar patientId="42" />);

    const dayButton = screen.getByRole('button', { name: /Sem sintomas/ });
    expect(dayButton.querySelector('.icon-diet')).toBeTruthy();
    expect(dayButton.querySelector('.icon-exercise')).toBeTruthy();
    expect(dayButton.querySelector('.icon-medication')).toBeTruthy();

    // The legend uses the same color classes so the day icons stay
    // recognizable against their key.
    expect(document.querySelector('.calendar-legend-icons .icon-diet')).toBeTruthy();
    expect(document.querySelector('.calendar-legend-icons .icon-exercise')).toBeTruthy();
    expect(document.querySelector('.calendar-legend-icons .icon-medication')).toBeTruthy();
    expect(document.querySelector('.calendar-legend-icons .icon-medication-partial')).toBeTruthy();
  });

  it('mostra o skeleton enquanto carrega e o estado de erro quando a busca falha', () => {
    useProfessionalCalendar.mockReturnValue({ data: undefined, isLoading: true, error: null });
    const { container, unmount } = render(<PatientMonitoringCalendar patientId="42" />);
    expect(container.querySelector('.calendar-layout')).toBeTruthy();
    unmount();

    useProfessionalCalendar.mockReturnValue({ data: undefined, isLoading: false, error: new Error('falhou') });
    render(<PatientMonitoringCalendar patientId="42" />);
    expect(screen.getByText('falhou')).toBeTruthy();
  });
});
