import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { aiReportsApi, aiReportErrorMessage, eligibilityMessage, fullMonitoringPeriod, inclusiveDays, shortcutPeriod, validateAiReportPeriod } from '@/services/aiReports';

describe('períodos de relatórios com IA', () => {
  it('rejeita período menor que 30 dias', () => expect(validateAiReportPeriod('2026-07-03', '2026-07-31', '2026-07-31')).toContain('mínimo 30'));
  it('rejeita data futura', () => expect(validateAiReportPeriod('2026-07-01', '2026-08-01', '2026-07-31')).toContain('futuro'));
  it('rejeita datas invertidas', () => expect(validateAiReportPeriod('2026-07-31', '2026-07-01', '2026-07-31')).toContain('posterior'));
  it('calcula intervalo inclusivo', () => expect(inclusiveDays('2026-07-02', '2026-07-31')).toBe(30));
  it('preenche atalho de 30 dias', () => expect(shortcutPeriod(30, new Date('2026-07-31T12:00:00Z'))).toEqual({ start_date: '2026-07-02', end_date: '2026-07-31' }));
  it('preenche atalho de 365 dias', () => expect(shortcutPeriod(365, new Date('2026-07-31T12:00:00Z'))).toEqual({ start_date: '2025-08-01', end_date: '2026-07-31' }));
  it('limita todo o acompanhamento a cinco anos', () => expect(fullMonitoringPeriod('2010-01-01', new Date('2026-07-31T12:00:00Z')).start_date).toBe('2021-08-01'));
});

describe('cliente e mensagens', () => {
  it.each([
    ['INSUFFICIENT_DATA', 'check-ins respondidos suficientes'],
    ['PATIENT_MONTHLY_LIMIT_REACHED', 'data indicada'],
    ['REPORT_IN_PROGRESS', 'geração'],
  ])('traduz inelegibilidade %s', (code, fragment) => expect(eligibilityMessage(code)).toContain(fragment));

  it.each([
    ['PREVIEW_TOKEN_EXPIRED', 'segurança'],
    ['PREVIEW_DATA_CHANGED', 'mudaram'],
    ['PREVIEW_TOKEN_MISMATCH', 'segurança'],
    ['REPORT_INPUT_TOO_LARGE', 'intervalo menor'],
    ['REPORT_COST_LIMIT_EXCEEDED', 'limite operacional'],
  ])('traduz erro %s', (code, fragment) => expect(aiReportErrorMessage(new ApiError('x', 422, { detail: { code } }))).toContain(fragment));

  it('monta preview, geração, histórico paginado/filtro e detalhe no cliente autenticado', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [], pagination: { page: 2, per_page: 20, total: 0, total_pages: 0 } }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await aiReportsApi.history(9, 2, 20, 'COMPLETED');
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/professional/patients/9/ai-reports?page=2&per_page=20&status=COMPLETED');
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ report_id: 4 }), { status: 200 }));
    await aiReportsApi.detail(9, 4);
    expect(String(fetchMock.mock.calls[1][0])).toContain('/ai-reports/4');
  });
});
