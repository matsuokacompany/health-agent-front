import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PatientRelatorios from '@/app/(patient)/patient/relatorios/page';

const selfMonitoring = vi.hoisted(() => ({ listInsights: vi.fn(), getEvolutionReport: vi.fn(), getInsight: vi.fn(), getInsightDetail: vi.fn() }));
vi.mock('@/services/selfMonitoring', () => ({ selfMonitoringApi: selfMonitoring }));

const baseReport = {
  patient_id: 1,
  start_date: '2025-09-23',
  end_date: '2026-09-23',
  period_days: 365,
  aggregation: 'weekly' as const,
  minimum_completed_checkins: 10,
  sufficient_data: true,
  metrics: { total_checkins: 30, completed_checkins: 28, pending_checkins: 2, checkins_with_symptoms: 5, checkins_without_symptoms: 23, days_with_checkins: 28, adherence_percentage: 93.3, symptom_rate_percentage: 17.9, calendar_coverage_percentage: 93.3 },
  symptom_trend: 'stable' as const,
  symptom_trend_change_percentage_points: 1.2,
  longest_gap_days: 2,
  symptoms: [],
  timeline: [],
  adherence: { diet_percentage: 80, exercise_percentage: null, medication_percentage: 100 },
  red_flag_events: [],
  risk_factors: [],
};

const items = [
  { id: 5, start_date: '2026-08-01', end_date: '2026-08-30', generated_at: '2026-08-30T10:00:00Z', next_generation_at: null },
  { id: 4, start_date: '2026-07-01', end_date: '2026-07-30', generated_at: '2026-07-30T10:00:00Z', next_generation_at: null },
];

function digits(date: Date) {
  return `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(2, '0')}${date.getFullYear()}`;
}

describe('página de relatórios do paciente', () => {
  beforeEach(() => {
    selfMonitoring.listInsights.mockReset().mockResolvedValue({ items, pagination: { page: 1, per_page: 20, total: 2, total_pages: 1 } });
    selfMonitoring.getEvolutionReport.mockReset().mockResolvedValue(baseReport);
    selfMonitoring.getInsight.mockReset();
    selfMonitoring.getInsightDetail.mockReset();
  });
  afterEach(cleanup);

  it('lista os relatórios em uma tabela', async () => {
    render(<PatientRelatorios />);

    await waitFor(() => expect(selfMonitoring.listInsights).toHaveBeenCalled());
    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Ver relatório' })).toHaveLength(2);
  });

  it('abre o relatório em um modal ao clicar em "Ver relatório", sem navegar de página', async () => {
    selfMonitoring.getInsightDetail.mockResolvedValue({
      id: 5, patient_id: 1, start_date: '2026-08-01', end_date: '2026-08-30', sufficient_data: true, generated_at: '2026-08-30T10:00:00Z',
      insight: { resumo: 'Resumo do relatório de agosto.', pontos_positivos: [], pontos_de_atencao: [], especialidade_sugerida: 'Clínico geral', urgencia_consulta: 'baixa' as const, sugestao: 'Converse com seu médico.' },
    });

    render(<PatientRelatorios />);
    await waitFor(() => expect(selfMonitoring.listInsights).toHaveBeenCalled());
    fireEvent.click(screen.getAllByRole('button', { name: 'Ver relatório' })[0]);

    expect(await screen.findByText('Resumo do relatório de agosto.')).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('não mostra mais o grid de métricas de adesão na página de relatórios', async () => {
    render(<PatientRelatorios />);

    await waitFor(() => expect(selfMonitoring.getEvolutionReport).toHaveBeenCalled());
    expect(screen.queryByText('Adesão aos check-ins')).toBeNull();
  });

  it('período personalizado exige as duas datas antes de recarregar o relatório de evolução', async () => {
    render(<PatientRelatorios />);
    await waitFor(() => expect(selfMonitoring.getEvolutionReport).toHaveBeenCalled());
    selfMonitoring.getEvolutionReport.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Período personalizado' }));
    expect(selfMonitoring.getEvolutionReport).not.toHaveBeenCalled();

    const end = new Date();
    end.setDate(end.getDate() - 1);
    const start = new Date(end);
    start.setDate(start.getDate() - 30);

    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: digits(start) } });
    expect(selfMonitoring.getEvolutionReport).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: digits(end) } });

    await waitFor(() => expect(selfMonitoring.getEvolutionReport).toHaveBeenCalled());
  });
});
