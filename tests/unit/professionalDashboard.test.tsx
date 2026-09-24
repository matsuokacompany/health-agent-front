import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProfessionalDashboard from '@/app/(professional)/professional/dashboard/page';

const useProfessionalDashboardOverview = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useProfessional', () => ({ useProfessionalDashboardOverview }));

// Mirrors the chart's own bucketing (professional/dashboard/page.tsx) so a
// mocked weekly point actually lands inside the chart's most recent
// 7-day bucket instead of being silently filtered out as out-of-range.
function mostRecentWeekStart() {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

describe('dashboard do profissional', () => {
  afterEach(cleanup);

  it('mostra o total de pacientes ativos junto com os sintomas de risco', () => {
    useProfessionalDashboardOverview.mockReturnValue({
      data: { active_patients: 5, red_flags: [], top_symptoms: [] },
      isLoading: false,
      error: null,
    });
    render(<ProfessionalDashboard />);
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('pacientes ativos')).toBeTruthy();
    expect(screen.getByText('Sintomas de risco relatados')).toBeTruthy();
  });

  it('lista os sintomas de risco recentes com link para o paciente', () => {
    useProfessionalDashboardOverview.mockReturnValue({
      data: {
        active_patients: 2,
        red_flags: [
          { patient_id: 10, patient_name: 'Maria Silva', report_date: '2026-01-05', category_key: 'cardiorrespiratorio', category_label: 'Sinais cardiorrespiratórios', tier: 'absoluto' },
        ],
        top_symptoms: [],
      },
      isLoading: false,
      error: null,
    });
    render(<ProfessionalDashboard />);
    expect(screen.getByText('Maria Silva')).toBeTruthy();
    expect(screen.getByText('Sinais cardiorrespiratórios')).toBeTruthy();
    const link = screen.getByText('Maria Silva').closest('a');
    expect(link?.getAttribute('href')).toBe('/professional/patients/10/checkins');
  });

  it('mostra os sintomas mais relatados entre os pacientes', () => {
    useProfessionalDashboardOverview.mockReturnValue({
      data: { active_patients: 3, red_flags: [], top_symptoms: [{ label: 'Cefaleia', count: 4, samples: [] }] },
      isLoading: false,
      error: null,
    });
    render(<ProfessionalDashboard />);
    expect(screen.getByText('Cefaleia')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
  });

  it('mostra estados vazios quando não há dados', () => {
    useProfessionalDashboardOverview.mockReturnValue({
      data: { active_patients: 0, red_flags: [], top_symptoms: [] },
      isLoading: false,
      error: null,
    });
    render(<ProfessionalDashboard />);
    expect(screen.getByText(/Nenhum sintoma de risco relatado/)).toBeTruthy();
    expect(screen.getByText(/Nenhum sintoma registrado ainda/)).toBeTruthy();
  });

  it('não mostra mais o gráfico diário de sinais de risco', () => {
    useProfessionalDashboardOverview.mockReturnValue({
      data: { active_patients: 0, red_flags: [], top_symptoms: [] },
      isLoading: false,
      error: null,
    });
    render(<ProfessionalDashboard />);
    expect(screen.queryByText('Sinais de risco por dia')).toBeNull();
  });

  it('mostra o skeleton enquanto carrega', () => {
    useProfessionalDashboardOverview.mockReturnValue({ data: undefined, isLoading: true, error: null });
    render(<ProfessionalDashboard />);
    expect(screen.getByLabelText('Carregando dashboard')).toBeTruthy();
  });

  it('mostra o gráfico de adesão dos pacientes como barras agrupadas, com legenda', () => {
    useProfessionalDashboardOverview.mockReturnValue({
      data: {
        active_patients: 2,
        red_flags: [],
        top_symptoms: [],
        adherence: [
          { patient_id: 10, patient_name: 'Maria Silva', adherence_percentage: 40, weekly: [{ week_start: mostRecentWeekStart(), adherence_percentage: 40 }] },
          { patient_id: 11, patient_name: 'João Souza', adherence_percentage: 90, weekly: [{ week_start: mostRecentWeekStart(), adherence_percentage: 90 }] },
        ],
        symptoms_by_month: [],
      },
      isLoading: false,
      error: null,
    });
    render(<ProfessionalDashboard />);
    expect(screen.getByText('Adesão dos pacientes')).toBeTruthy();
    const legendNames = screen.getAllByText('Maria Silva').filter((el) => el.closest('.chart-legend'));
    expect(legendNames.length).toBe(1);
    expect(screen.getAllByText('João Souza').length).toBeGreaterThan(0);
    expect(screen.getAllByText('40%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('90%').length).toBeGreaterThan(0);
    // Adherence is bars now, not an SVG line chart.
    const adherenceCard = screen.getByText('Adesão dos pacientes').closest('article');
    expect(adherenceCard?.querySelector('.trend-chart-group-bar')).toBeTruthy();
    expect(adherenceCard?.querySelector('svg polyline')).toBeNull();
  });

  it('agrupa pacientes além do limite de séries em uma linha "Outros"', () => {
    const adherence = Array.from({ length: 10 }, (_, index) => ({
      patient_id: index + 1,
      patient_name: `Paciente ${index + 1}`,
      adherence_percentage: 50,
      weekly: [{ week_start: '2026-09-01', adherence_percentage: 50 }],
    }));
    useProfessionalDashboardOverview.mockReturnValue({
      data: { active_patients: 10, red_flags: [], top_symptoms: [], adherence, symptoms_by_month: [] },
      isLoading: false,
      error: null,
    });
    render(<ProfessionalDashboard />);
    expect(screen.getByText('Outros pacientes (2)')).toBeTruthy();
  });

  it('mostra o gráfico de sintomas por mês por último, ocupando a linha inteira', () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    useProfessionalDashboardOverview.mockReturnValue({
      data: {
        active_patients: 1,
        red_flags: [],
        top_symptoms: [],
        adherence: [],
        symptoms_by_month: [{ month: currentMonth, count: 7 }],
      },
      isLoading: false,
      error: null,
    });
    const { container } = render(<ProfessionalDashboard />);
    expect(screen.getByText('Sintomas por mês')).toBeTruthy();
    expect(screen.getByText('7 registros de sintomas no período, somando todos os pacientes.')).toBeTruthy();
    // Sintomas por mês is a line now, not grouped bars.
    expect(container.querySelector('.line-chart-svg polyline')).toBeTruthy();
    expect(container.querySelector('.trend-chart-group-bar')).toBeNull();
  });

  it('mostra estados vazios para adesão quando não há check-ins', () => {
    useProfessionalDashboardOverview.mockReturnValue({
      data: { active_patients: 0, red_flags: [], top_symptoms: [], adherence: [], symptoms_by_month: [] },
      isLoading: false,
      error: null,
    });
    render(<ProfessionalDashboard />);
    expect(screen.getByText(/Nenhum check-in registrado pelos seus pacientes/)).toBeTruthy();
  });
});
