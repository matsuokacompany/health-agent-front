import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProfessionalDashboard from '@/app/(professional)/professional/dashboard/page';

const useProfessionalDashboardOverview = vi.hoisted(() => vi.fn());
vi.mock('@/hooks/useProfessional', () => ({ useProfessionalDashboardOverview }));

describe('dashboard do profissional', () => {
  afterEach(cleanup);

  it('mostra o total de pacientes ativos', () => {
    useProfessionalDashboardOverview.mockReturnValue({
      data: { active_patients: 5, red_flags: [], top_symptoms: [] },
      isLoading: false,
      error: null,
    });
    render(<ProfessionalDashboard />);
    expect(screen.getByText('Pacientes ativos')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
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

  it('mostra o skeleton enquanto carrega', () => {
    useProfessionalDashboardOverview.mockReturnValue({ data: undefined, isLoading: true, error: null });
    render(<ProfessionalDashboard />);
    expect(screen.getByLabelText('Carregando dashboard')).toBeTruthy();
  });

  it('mostra o gráfico de adesão dos pacientes', () => {
    useProfessionalDashboardOverview.mockReturnValue({
      data: {
        active_patients: 2,
        red_flags: [],
        top_symptoms: [],
        adherence: [
          { patient_id: 10, patient_name: 'Maria Silva', adherence_percentage: 40 },
          { patient_id: 11, patient_name: 'João Souza', adherence_percentage: 90 },
        ],
        symptoms_by_month: [],
      },
      isLoading: false,
      error: null,
    });
    render(<ProfessionalDashboard />);
    expect(screen.getByText('Adesão dos pacientes')).toBeTruthy();
    expect(screen.getByText('Maria Silva')).toBeTruthy();
    expect(screen.getByText('40%')).toBeTruthy();
    expect(screen.getByText('João Souza')).toBeTruthy();
    expect(screen.getByText('90%')).toBeTruthy();
  });

  it('mostra o gráfico de sintomas por mês', () => {
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
    render(<ProfessionalDashboard />);
    expect(screen.getByText('Sintomas por mês')).toBeTruthy();
    expect(screen.getByText('7 registros de sintomas no período, somando todos os pacientes.')).toBeTruthy();
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
