import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportDetailModal } from '@/components/patient/ReportDetailModal';

const selfMonitoring = vi.hoisted(() => ({ getInsightDetail: vi.fn() }));
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

describe('modal de detalhe do relatório', () => {
  beforeEach(() => {
    selfMonitoring.getInsightDetail.mockReset();
  });
  afterEach(cleanup);

  it('não abre quando reportId é null', () => {
    render(<ReportDetailModal reportId={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('mostra o resumo e o período do relatório', async () => {
    selfMonitoring.getInsightDetail.mockResolvedValue(insight);

    render(<ReportDetailModal reportId={3} onClose={vi.fn()} />);

    expect(await screen.findByText('Você tem mostrado um bom comprometimento com seus check-ins.')).toBeTruthy();
    expect(screen.getByText(/Período de/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Baixar PDF/ })).toBeTruthy();
    // The period's adherence/symptom metrics live on /patient/relatorios
    // now, scoped to that page's own period filter -- not fetched again
    // here for the report's own saved period.
    expect(selfMonitoring.getInsightDetail).toHaveBeenCalledTimes(1);
  });

  it('separa pontos positivos e pontos de atenção em seções próprias', async () => {
    selfMonitoring.getInsightDetail.mockResolvedValue(insight);

    render(<ReportDetailModal reportId={3} onClose={vi.fn()} />);

    expect(await screen.findByText('Pontos positivos')).toBeTruthy();
    expect(screen.getByText('Pontos de atenção')).toBeTruthy();
    expect(screen.getByText('Boa adesão aos check-ins com 82.8% de adesão.')).toBeTruthy();
    expect(screen.getByText('Presença de enxaqueca e dor cervical/lombar.')).toBeTruthy();
  });

  it('fecha ao clicar no botão de fechar', async () => {
    selfMonitoring.getInsightDetail.mockResolvedValue(insight);
    const onClose = vi.fn();

    render(<ReportDetailModal reportId={3} onClose={onClose} />);
    await screen.findByText('Você tem mostrado um bom comprometimento com seus check-ins.');
    screen.getByRole('button', { name: 'Fechar modal' }).click();
    expect(onClose).toHaveBeenCalled();
  });
});
