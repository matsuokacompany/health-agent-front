import type { PatientHandoffSummary } from '@/lib/types';
import { type PdfTextBlock, downloadPdfBlob, formatPdfDate, renderPdfTextBlocks } from './textPdf';

export type HandoffPdfInput = { summary: PatientHandoffSummary; patientName?: string };

const DISCLAIMER = 'Documento gerado a partir dos dados registrados pelo paciente na plataforma Julha, sem interpretação por inteligência artificial. Não substitui avaliação clínica.';

function percentage(value: unknown) {
  return value === null || value === undefined ? 'Não se aplica' : `${Math.round(Number(value))}%`;
}

function monitoringBlocks(summary: PatientHandoffSummary): PdfTextBlock[] {
  const monitoring = summary.monitoring_summary as Record<string, unknown> | null | undefined;
  if (!monitoring || monitoring.sufficient_data === false) {
    return [{ kind: 'text', text: 'Dados de automonitoramento insuficientes para o período.' }];
  }
  const metrics = monitoring.metrics as Record<string, unknown> | undefined;
  const adherence = monitoring.adherence as Record<string, unknown> | undefined;
  const symptoms = (monitoring.symptoms as Array<{ description: string; occurrences: number }> | undefined) ?? [];
  const blocks: PdfTextBlock[] = [
    { kind: 'text', text: `Período: ${formatPdfDate(String(monitoring.start_date ?? ''))} a ${formatPdfDate(String(monitoring.end_date ?? ''))}` },
  ];
  if (metrics) {
    blocks.push({ kind: 'text', text: `Adesão aos check-ins: ${percentage(metrics.adherence_percentage)}` });
    blocks.push({ kind: 'text', text: `Taxa de sintomas: ${percentage(metrics.symptom_rate_percentage)}` });
  }
  if (adherence) {
    blocks.push({ kind: 'text', text: `Adesão à dieta: ${percentage(adherence.diet_percentage)}` });
    blocks.push({ kind: 'text', text: `Adesão a exercícios: ${percentage(adherence.exercise_percentage)}` });
    blocks.push({ kind: 'text', text: `Adesão à medicação: ${percentage(adherence.medication_percentage)}` });
  }
  if (symptoms.length) {
    blocks.push({ kind: 'text', text: 'Sintomas mais relatados no período:' });
    symptoms.slice(0, 10).forEach((symptom) => blocks.push({ kind: 'bullet', text: `${symptom.description} (${symptom.occurrences}x)` }));
  }
  return blocks;
}

const ALLERGY_MATCH_DISCLAIMER = 'Correspondência literal de texto entre o que foi registrado como alergia/restrição e o que o paciente escreveu em um check-in -- não é um diagnóstico de reação.';

function allergyMatchBlocks(summary: PatientHandoffSummary): PdfTextBlock[] {
  const matches = summary.possible_allergy_matches ?? [];
  if (!matches.length) {
    return [{ kind: 'text', text: 'Nenhuma possível relação identificada no período.' }];
  }
  const blocks: PdfTextBlock[] = matches.map((match) => ({
    kind: 'bullet' as const,
    text: `${formatPdfDate(match.report_date)}: ${match.matched_terms.join(', ')}`,
  }));
  blocks.push({ kind: 'text', text: ALLERGY_MATCH_DISCLAIMER });
  return blocks;
}

export function buildHandoffPdfBlocks({ summary, patientName }: HandoffPdfInput): PdfTextBlock[] {
  const blocks: PdfTextBlock[] = [
    { kind: 'title', text: 'Resumo clínico para consulta' },
    { kind: 'text', text: `Paciente: ${patientName?.trim() || `Paciente ${summary.patient_id}`}` },
    { kind: 'text', text: `Gerado em: ${formatPdfDate(summary.generated_at, true)}` },
    { kind: 'heading', text: 'Anamnese' },
    { kind: 'text', text: summary.anamnese_info?.trim() || 'Anamnese não registrada.' },
    { kind: 'heading', text: 'Fatores de risco registrados' },
    ...(summary.risk_factors.length
      ? summary.risk_factors.map((label) => ({ kind: 'bullet' as const, text: label }))
      : [{ kind: 'text' as const, text: 'Nenhum fator de risco registrado.' }]),
    { kind: 'heading', text: 'Alergias e restrições' },
    { kind: 'text', text: `Medicamentos: ${summary.medication_allergies?.trim() || 'Nenhuma alergia a medicamento registrada.'}` },
    { kind: 'text', text: `Alimentos: ${summary.food_restrictions?.trim() || 'Nenhuma restrição alimentar registrada.'}` },
    { kind: 'heading', text: 'Suplementos e medicações em uso' },
    ...(summary.supplements.length
      ? summary.supplements.map((supplement) => ({
          kind: 'bullet' as const,
          text: `${supplement.name} — ${supplement.dosage_times}x por ${{ DAY: 'dia', WEEK: 'semana', MONTH: 'mês' }[supplement.dosage_period]}`,
        }))
      : [{ kind: 'text' as const, text: 'Nenhum suplemento ou medicação registrada.' }]),
    { kind: 'heading', text: 'Plano alimentar' },
    { kind: 'text', text: summary.diet_document
      ? `Anexado: ${summary.diet_document.original_filename} (enviado em ${formatPdfDate(summary.diet_document.updated_at)}) — disponível na plataforma.`
      : 'Nenhum plano alimentar em PDF anexado.' },
    { kind: 'heading', text: 'Resumo do automonitoramento' },
    ...monitoringBlocks(summary),
    { kind: 'heading', text: 'Possíveis relações com alergias/restrições' },
    ...allergyMatchBlocks(summary),
    { kind: 'heading', text: 'Aviso importante' },
    { kind: 'text', text: DISCLAIMER },
  ];
  return blocks;
}

export function createHandoffPdf(input: HandoffPdfInput) {
  return renderPdfTextBlocks(buildHandoffPdfBlocks(input));
}

export function downloadHandoffPdf(blob: Blob, patientId: number) {
  downloadPdfBlob(blob, `resumo-clinico-paciente-${patientId}.pdf`);
}
