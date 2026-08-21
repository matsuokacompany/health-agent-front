'use client';
import { useRef, useState } from 'react';
import { aiReportsApi, type AiReport, type AiReportStatus } from '@/services/aiReports';
import { createAiReportPdf, downloadAiReportPdf } from '@/lib/aiReportPdf';

type Props = { report?: AiReport; patientId: number; reportId: number; status: AiReportStatus; patientName?: string };
export function AiReportPdfButton({ report, patientId, reportId, status, patientName }: Props) {
  const [generating, setGenerating] = useState(false); const [error, setError] = useState<string | null>(null); const lock = useRef(false);
  if (status !== 'COMPLETED') return null;
  async function download() { if (lock.current) return; lock.current = true; setGenerating(true); setError(null); try { await new Promise<void>(resolve => window.setTimeout(resolve, 0)); const completeReport = report ?? await aiReportsApi.detail(patientId, reportId); if (completeReport.status !== 'COMPLETED') throw new Error('Relatório indisponível'); const blob = createAiReportPdf({ report: completeReport, patientName }); downloadAiReportPdf(blob, completeReport.patient_id, completeReport.report_id); } catch { setError('Não foi possível gerar o PDF. Tente novamente.'); } finally { lock.current = false; setGenerating(false); } }
  return <div className="ai-pdf-download"><button className="button secondary" type="button" disabled={generating} onClick={() => void download()}>{generating ? 'Gerando PDF...' : 'Baixar PDF'}</button>{generating ? <span className="muted" role="status">Preparando o arquivo com segurança...</span> : null}{error ? <p className="notice danger" role="alert">{error}</p> : null}</div>;
}
