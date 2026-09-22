import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PatientRelatorioDetail from '@/app/(patient)/patient/relatorios/[id]/page';

vi.mock('next/navigation', () => ({ useParams: () => ({ id: '3' }) }));

const selfMonitoring = vi.hoisted(() => ({ getInsightDetail: vi.fn(), getEvolutionReport: vi.fn() }));
vi.mock('@/services/selfMonitoring', () => ({ selfMonitoringApi: selfMonitoring }));

const insight = {
  id: 3,
  patient_id: 1,
  start_date: '2026-08-23',
  end_date: '2026-09-21',
  sufficient_data: true,
  generated_at: '2026-09-21T12:00:00Z',
  insight: {
    resumo: 'Você tem mostrado um bom comprometimento com seus check-ins.',
    pontos_positivos: ['Boa adesão aos check-ins com 82.8% de adesão.'],
    pontos_de_atencao: ['Presença de enxaqueca e dor cervical/lombar.'],
    especialidade_sugerida: 'Clínico geral',
    urgencia_consulta: 'baixa' as const,
    sugestao: 'Considere conversar com um profissional de saúde.',
  },
};

const evolutionReport = {
  patient_id: 1,
  start_date: '2026-08-23',
  end_date: '2026-09-21',
  period_days: 30,
  aggregation: 'weekly' as const,
  minimum_completed_checkins: 10,
  sufficient_data: true,
  metrics: { total_checkins: 30, completed_checkins: 24, pending_checkins: 6, checkins_with_symptoms: 5, checkins_without_symptoms: 19, days_with_checkins: 24, adherence_percentage: 82.8, symptom_rate_percentage: 20.8, calendar_coverage_percentage: 82.8 },
  symptom_trend: 'stable' as const,
  longest_gap_days: 2,
  symptoms: [],
  timeline: [],
  adherence: { diet_percentage: 80, exercise_percentage: null, medication_percentage: null },
  red_flag_events: [],
  risk_factors: [],
};

describe('detalhe do relatório de resumo por IA', () => {
  beforeEach(() => {
    selfMonitoring.getInsightDetail.mockReset();
    selfMonitoring.getEvolutionReport.mockReset();
  });
  afterEach(cleanup);

  it('não mostra o título genérico e mostra as métricas do período junto do resumo', async () => {
    selfMonitoring.getInsightDetail.mockResolvedValue(insight);
    selfMonitoring.getEvolutionReport.mockResolvedValue(evolutionReport);

    render(<PatientRelatorioDetail />);

    expect(await screen.findByText('Você tem mostrado um bom comprometimento com seus check-ins.')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Resumo por IA' })).toBeNull();
    expect(screen.queryByText('Relatórios')).toBeNull();
    await waitFor(() => expect(screen.getByText('Adesão aos check-ins')).toBeTruthy());
    expect(screen.getByText('82.8%')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Baixar PDF/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Voltar ao histórico/ })).toBeTruthy();
  });

  it('separa pontos positivos e pontos de atenção em seções próprias', async () => {
    selfMonitoring.getInsightDetail.mockResolvedValue(insight);
    selfMonitoring.getEvolutionReport.mockResolvedValue(evolutionReport);

    render(<PatientRelatorioDetail />);

    expect(await screen.findByText('Pontos positivos')).toBeTruthy();
    expect(screen.getByText('Pontos de atenção')).toBeTruthy();
    expect(screen.getByText('Boa adesão aos check-ins com 82.8% de adesão.')).toBeTruthy();
    expect(screen.getByText('Presença de enxaqueca e dor cervical/lombar.')).toBeTruthy();
  });

  it('não quebra quando as métricas do período não estão disponíveis', async () => {
    selfMonitoring.getInsightDetail.mockResolvedValue(insight);
    selfMonitoring.getEvolutionReport.mockRejectedValue(new Error('falha'));

    render(<PatientRelatorioDetail />);

    expect(await screen.findByText('Você tem mostrado um bom comprometimento com seus check-ins.')).toBeTruthy();
    expect(screen.queryByText('Adesão aos check-ins')).toBeNull();
  });
});
