import type { AiReport, AiReportMode } from '@/services/aiReports';

export type PdfTextBlock = { kind: 'title' | 'heading' | 'text' | 'bullet'; text: string };
export type AiReportPdfInput = { report: AiReport; patientName?: string };
const MODE_LABELS: Record<AiReportMode, string> = { preventivo: 'Análise preventiva', avaliacao_clinica: 'Apoio à avaliação clínica' };
const KEY_LABELS: Record<string, string> = { avaliacao_clinica: 'Avaliação clínica', hipotese_principal: 'Principal possibilidade a investigar', possiveis_doencas: 'Outras possibilidades', nivel_de_suspeicao: 'Nível de atenção sugerido', justificativa: 'Informações consideradas', especialista_recomendado: 'Especialidade sugerida', exames_prioritarios: 'Exames prioritários', exames_sugeridos: 'Exames sugeridos', urgencia: 'Urgência', alerta_legal: 'Observação importante', alerta_importante: 'Ponto importante', interpretacao: 'Interpretação', avaliacao: 'Avaliação', cenarios: 'Cenários', cenario_mais_provavel: 'Cenário mais provável', descricao: 'Descrição', condicoes_para_ocorrer: 'Condições para ocorrer', probabilidade: 'Probabilidade' };
const BLOCKED_KEYS = new Set(['estimated_cost', 'actual_cost', 'input_tokens', 'output_tokens', 'model_name', 'requested_by_user_id', 'failure_code', 'access_token', 'refresh_token']);
const DISCLAIMER = 'Este conteúdo auxilia o acompanhamento profissional e não substitui avaliação clínica.';

export function friendlyAiKey(key: string) { return KEY_LABELS[key] ?? key.replace(/[_-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()); }
function scalar(value: unknown) { if (value === null || value === undefined || value === '') return 'Não informado'; if (typeof value === 'boolean') return value ? 'Sim' : 'Não'; return String(value); }
export function aiValueToPdfBlocks(value: unknown, key?: string, depth = 0): PdfTextBlock[] {
  const blocks: PdfTextBlock[] = [];
  if (key) blocks.push({ kind: depth <= 1 ? 'heading' : 'text', text: friendlyAiKey(key) });
  if (Array.isArray(value)) {
    if (!value.length) return [...blocks, { kind: 'text', text: 'Não informado' }];
    value.forEach(item => { if (item && typeof item === 'object') blocks.push(...aiValueToPdfBlocks(item, undefined, depth + 1)); else blocks.push({ kind: 'bullet', text: scalar(item) }); });
  } else if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) blocks.push({ kind: 'text', text: 'Não informado' });
    entries.filter(([childKey]) => !BLOCKED_KEYS.has(childKey)).forEach(([childKey, child]) => blocks.push(...aiValueToPdfBlocks(child, childKey, depth + 1)));
  } else if (key && depth > 1) {
    blocks[blocks.length - 1] = { kind: 'text', text: `${friendlyAiKey(key)}: ${scalar(value)}` };
  } else blocks.push({ kind: 'text', text: scalar(value) });
  return blocks;
}
export function formatPdfDate(value?: string | null, withTime = false) { if (!value) return 'Não informado'; const parsed = withTime ? new Date(value) : new Date(`${value.slice(0, 10)}T12:00:00`); return new Intl.DateTimeFormat('pt-BR', withTime ? { dateStyle: 'short', timeStyle: 'short' } : { dateStyle: 'short' }).format(parsed); }
export function buildAiReportPdfBlocks({ report, patientName }: AiReportPdfInput): PdfTextBlock[] { return [
  { kind: 'title', text: 'Relatório de acompanhamento com IA' },
  { kind: 'text', text: `Relatório nº ${report.report_id}` },
  { kind: 'heading', text: 'Identificação' },
  { kind: 'text', text: `Paciente: ${patientName?.trim() || `Paciente ${report.patient_id}`}` },
  { kind: 'text', text: `Período: ${formatPdfDate(report.start_date)} a ${formatPdfDate(report.end_date)}` },
  { kind: 'text', text: `Modo: ${MODE_LABELS[report.modo]}` },
  { kind: 'text', text: `Gerado em: ${formatPdfDate(report.generated_at, true)}` },
  { kind: 'heading', text: 'Resumo clínico' },
  { kind: 'text', text: report.clinical_summary?.trim() || 'Resumo clínico não informado.' },
  { kind: 'heading', text: 'Conteúdo da análise' },
  ...aiValueToPdfBlocks(report.ai),
  { kind: 'heading', text: 'Aviso importante' },
  { kind: 'text', text: DISCLAIMER },
]; }

function wrap(text: string, limit: number) { const lines: string[] = []; for (const paragraph of text.replace(/\r/g, '').split('\n')) { const words = paragraph.split(/\s+/).filter(Boolean); let line = ''; for (const word of words) { if (!line) line = word; else if (`${line} ${word}`.length <= limit) line += ` ${word}`; else { lines.push(line); line = word; } } lines.push(line || ' '); } return lines; }
function pdfEscape(text: string) { return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[\u0080-\uffff]/g, char => { const map: Record<string, number> = { '€': 128, '‚': 130, 'ƒ': 131, '„': 132, '…': 133, '†': 134, '‡': 135, 'ˆ': 136, '‰': 137, 'Š': 138, '‹': 139, 'Œ': 140, 'Ž': 142, '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151, '˜': 152, '™': 153, 'š': 154, '›': 155, 'œ': 156, 'ž': 158, 'Ÿ': 159 }; const code = map[char] ?? char.charCodeAt(0); return code <= 255 ? `\\${code.toString(8).padStart(3, '0')}` : '?'; }); }
export function createAiReportPdf(input: AiReportPdfInput) {
  const pages: string[][] = [[]]; let used = 0; const maxHeight = 700;
  for (const block of buildAiReportPdfBlocks(input)) { const size = block.kind === 'title' ? 18 : block.kind === 'heading' ? 13 : 10; const leading = size + 5; const lines = wrap(`${block.kind === 'bullet' ? '• ' : ''}${block.text}`, block.kind === 'title' ? 55 : 88); const required = lines.length * leading + (block.kind === 'heading' ? 8 : 3); if (used && used + Math.min(required, leading * 2) > maxHeight) { pages.push([]); used = 0; } lines.forEach(line => { if (used + leading > maxHeight) { pages.push([]); used = 0; } pages.at(-1)!.push(`BT /F1 ${size} Tf 56 ${800 - used} Td (${pdfEscape(line)}) Tj ET`); used += leading; }); used += block.kind === 'heading' ? 8 : 3; }
  const objects: string[] = []; const add = (value: string) => { objects.push(value); return objects.length; }; const catalog = add(''); const pagesId = add(''); const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'); const pageIds: number[] = [];
  pages.forEach(commands => { const stream = commands.join('\n'); const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`); pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${content} 0 R >>`)); });
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`; objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  let pdf = '%PDF-1.4\n%1234\n'; const offsets = [0]; objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; }); const xref = pdf.length; pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([new TextEncoder().encode(pdf)], { type: 'application/pdf' });
}
export function downloadAiReportPdf(blob: Blob, patientId: number, reportId: number) { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `relatorio-ia-paciente-${patientId}-${reportId}.pdf`; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0); }
