import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Automonitoramento from '@/app/(patient)/patient/automonitoramento/page';

const selfMonitoring = vi.hoisted(() => ({ getEvolutionReport: vi.fn(), getInsight: vi.fn(), listInsights: vi.fn() }));
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
  beforeEach(() => {
    selfMonitoring.getEvolutionReport.mockReset();
    selfMonitoring.getInsight.mockReset();
    selfMonitoring.listInsights.mockReset().mockResolvedValue({ items: [], pagination: { page: 1, per_page: 1, total: 0, total_pages: 0 } });
  });
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
    // Rendered even when the patient doesn't track exercise, with a "Não se
    // aplica" value, so the metrics grid always fills complete rows of four
    // instead of leaving gaps.
    expect(screen.getByText('Adesão ao exercício')).toBeTruthy();
    expect(screen.getByText('Não se aplica')).toBeTruthy();
    expect(screen.getByText('Tendência')).toBeTruthy();
    expect(screen.getByText('Estável')).toBeTruthy();
    expect(screen.queryByText('Tendência', { selector: '.eyebrow' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Baixar PDF' })).toBeTruthy();
  });

  it('não mostra o card de sinais de alerta quando não há eventos no período', async () => {
    selfMonitoring.getEvolutionReport.mockResolvedValue({ ...baseReport, red_flag_events: [], risk_factors: [] });

    render(<Automonitoramento />);

    await waitFor(() => expect(selfMonitoring.getEvolutionReport).toHaveBeenCalled());
    expect(screen.queryByText('Sinais identificados no período', { exact: false })).toBeNull();
    expect(screen.queryByText('Fatores de risco registrados')).toBeNull();
  });

  it('desabilita a geração de resumo e explica o cooldown quando já existe um resumo recente', async () => {
    selfMonitoring.getEvolutionReport.mockResolvedValue(baseReport);
    const nextGenerationAt = new Date(Date.now() + 5 * 86_400_000).toISOString();
    selfMonitoring.listInsights.mockResolvedValue({
      items: [{ id: 42, start_date: '2026-08-12', end_date: '2026-09-10', generated_at: '2026-09-10T12:00:00Z', next_generation_at: nextGenerationAt }],
      pagination: { page: 1, per_page: 1, total: 1, total_pages: 1 },
    });

    render(<Automonitoramento />);

    expect(await screen.findByText('Faltam 5 dias para o próximo.', { exact: false })).toBeTruthy();
    const button = screen.getByRole('button', { name: 'Disponível novamente em breve' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    const link = screen.getByRole('link', { name: 'Ver o resumo mais recente →' }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/patient/relatorios/42');
  });
});
