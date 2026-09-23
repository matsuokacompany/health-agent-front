import type { AiReport, AiReportMode } from '@/services/aiReports';
import { type PdfTextBlock, downloadPdfBlob, formatPdfDate, renderPdfTextBlocks } from './textPdf';

export type { PdfTextBlock };
export { formatPdfDate };
export type AiReportPdfInput = { report: AiReport; patientName?: string };
const MODE_LABELS: Record<AiReportMode, string> = { preventivo: 'Análise preventiva', avaliacao_clinica: 'Apoio à avaliação clínica' };
const KEY_LABELS: Record<string, string> = { hipoteses: 'Hipóteses', doenca: 'Hipótese', raciocinio: 'Raciocínio', nivel_de_suspeicao: 'Nível de suspeição', especialista_recomendado: 'Especialista recomendado', exames_prioritarios: 'Exames prioritários', urgencia: 'Urgência', alerta_legal: 'Observação importante', riscos_longo_prazo: 'Riscos de longo prazo', condicao: 'Condição de risco', nivel_de_atencao: 'Nível de atenção', alerta_importante: 'Ponto importante' };
const BLOCKED_KEYS = new Set(['estimated_cost', 'actual_cost', 'input_tokens', 'output_tokens', 'model_name', 'requested_by_user_id', 'failure_code', 'access_token', 'refresh_token']);
const TECHNICAL_KEY = /(?:^|_)(?:id|ids|cost|costs|token|tokens|model|prompt|message|messages|metadata|debug|trace)(?:_|$)/i;
const DISCLAIMER = 'Este conteúdo auxilia o acompanhamento profissional e não substitui avaliação clínica.';

export function friendlyAiKey(key: string) { return KEY_LABELS[key] ?? key.replace(/[_-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()); }
function scalar(value: unknown) { if (value === null || value === undefined || value === '') return 'Não informado'; if (typeof value === 'boolean') return value ? 'Sim' : 'Não'; return String(value); }
function isPrintableAiKey(key: string) { const normalized = key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase(); return !BLOCKED_KEYS.has(normalized) && !TECHNICAL_KEY.test(normalized); }
export function aiValueToPdfBlocks(value: unknown, key?: string, depth = 0): PdfTextBlock[] {
  const blocks: PdfTextBlock[] = [];
  if (key) blocks.push({ kind: depth <= 1 ? 'heading' : 'text', text: friendlyAiKey(key) });
  if (Array.isArray(value)) {
    if (!value.length) return [...blocks, { kind: 'text', text: 'Não informado' }];
    value.forEach(item => { if (item && typeof item === 'object') blocks.push(...aiValueToPdfBlocks(item, undefined, depth + 1)); else blocks.push({ kind: 'bullet', text: scalar(item) }); });
  } else if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) blocks.push({ kind: 'text', text: 'Não informado' });
    entries.filter(([childKey]) => isPrintableAiKey(childKey)).forEach(([childKey, child]) => blocks.push(...aiValueToPdfBlocks(child, childKey, depth + 1)));
  } else if (key && depth > 1) {
    blocks[blocks.length - 1] = { kind: 'text', text: `${friendlyAiKey(key)}: ${scalar(value)}` };
  } else blocks.push({ kind: 'text', text: scalar(value) });
  return blocks;
}
export function printableClinicalSummary(value?: string | null) {
  return value
    ?.split(/\n\s*(?:DADOS CONSOLIDADOS DO PER[IÍ]ODO|MENSAGEM INTERNA|INTERNAL MESSAGE)(?:\s*\(JSON\))?:/i)[0]
    .replace(/^ANAMNESE DO PACIENTE:\s*/i, '')
    .trim() || 'Resumo clínico não informado.';
}
export function buildAiReportPdfBlocks({ report, patientName }: AiReportPdfInput): PdfTextBlock[] { return [
  { kind: 'title', text: 'Relatório de acompanhamento com IA' },
  { kind: 'text', text: `Relatório nº ${report.report_id}` },
  { kind: 'heading', text: 'Identificação' },
  { kind: 'text', text: `Paciente: ${patientName?.trim() || `Paciente ${report.patient_id}`}` },
  { kind: 'text', text: `Período: ${formatPdfDate(report.start_date)} a ${formatPdfDate(report.end_date)}` },
  { kind: 'text', text: `Modo: ${MODE_LABELS[report.modo]}` },
  { kind: 'text', text: `Gerado em: ${formatPdfDate(report.generated_at, true)}` },
  { kind: 'heading', text: 'Resumo clínico' },
  { kind: 'text', text: printableClinicalSummary(report.clinical_summary) },
  { kind: 'heading', text: 'Conteúdo da análise' },
  ...aiValueToPdfBlocks(report.ai),
  { kind: 'heading', text: 'Aviso importante' },
  { kind: 'text', text: DISCLAIMER },
]; }

export function createAiReportPdf(input: AiReportPdfInput) {
  return renderPdfTextBlocks(buildAiReportPdfBlocks(input));
}
export function downloadAiReportPdf(blob: Blob, patientId: number, reportId: number) {
  downloadPdfBlob(blob, `relatorio-ia-paciente-${patientId}-${reportId}.pdf`);
}
