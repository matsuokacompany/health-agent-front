import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Automonitoramento from '@/app/(patient)/patient/automonitoramento/page';

const selfMonitoring = vi.hoisted(() => ({ getEvolutionReport: vi.fn(), getInsight: vi.fn() }));
vi.mock('@/services/selfMonitoring', () => ({ selfMonitoringApi: selfMonitoring }));

const baseReport = {
  patient_id: 1,
  start_date: '2026-08-12',
  end_date: '2026-09-10',
  period_days: 30,
  aggregation: 'weekly' as const,
  minimum_completed_checkins: 10,
  sufficient_data: true,
  metrics: {
    total_checkins: 30,
    completed_checkins: 28,
    pending_checkins: 2,
    checkins_with_symptoms: 5,
    checkins_without_symptoms: 23,
    days_with_checkins: 28,
    adherence_percentage: 93.3,
    symptom_rate_percentage: 17.9,
    calendar_coverage_percentage: 93.3,
  },
  symptom_trend: 'stable' as const,
  longest_gap_days: 2,
  symptoms: [{ description: 'Dor de cabeça', occurrences: 3, first_reported_at: '2026-08-15', last_reported_at: '2026-09-01' }],
  timeline: [],
  adherence: { diet_percentage: 80, exercise_percentage: null, medication_percentage: 100 },
  red_flag_events: [{ report_date: '2026-08-20', category_key: 'cardiorrespiratorio', category_label: 'Sinais cardiorrespiratórios', tier: 'absoluto' as const }],
  risk_factors: ['Doença cardíaca', 'Diabetes'],
};

describe('relatório de automonitoramento do paciente', () => {
  beforeEach(() => { selfMonitoring.getEvolutionReport.mockReset(); selfMonitoring.getInsight.mockReset(); });
  afterEach(cleanup);

  it('mostra sinais de alerta, adesão e fatores de risco no relatório', async () => {
    selfMonitoring.getEvolutionReport.mockResolvedValue(baseReport);

    render(<Automonitoramento />);

    expect(await screen.findByText('Sinais cardiorrespiratórios')).toBeTruthy();
    expect(screen.getByText('Doença cardíaca')).toBeTruthy();
    expect(screen.getByText('Diabetes')).toBeTruthy();
    expect(screen.getByText('Adesão à dieta')).toBeTruthy();
    expect(screen.getByText('80%')).toBeTruthy();
    expect(screen.getByText('Adesão à medicação/suplemento')).toBeTruthy();
    expect(screen.queryByText('Adesão ao exercício')).toBeNull();
    expect(screen.getByRole('button', { name: 'Baixar PDF / Imprimir' })).toBeTruthy();
  });

  it('não mostra o card de sinais de alerta quando não há eventos no período', async () => {
    selfMonitoring.getEvolutionReport.mockResolvedValue({ ...baseReport, red_flag_events: [], risk_factors: [] });

    render(<Automonitoramento />);

    await waitFor(() => expect(selfMonitoring.getEvolutionReport).toHaveBeenCalled());
    expect(screen.queryByText('Sinais identificados no período', { exact: false })).toBeNull();
    expect(screen.queryByText('Fatores de risco registrados')).toBeNull();
  });
});
