'use client';
import { useRef, useState } from 'react';
import { patientHandoffApi } from '@/services/patientHandoff';
import { createHandoffPdf, downloadHandoffPdf } from '@/lib/handoffPdf';

type Props = { patientId: number; patientName?: string; forProfessional?: boolean };

/** Lets a patient (typically self-monitoring, with nobody assigned on the
 * platform) download a factual, non-AI clinical summary to bring to a
 * doctor's appointment -- see PatientHandoffService on the backend. A
 * professional viewing one of their own patients can download the same
 * summary via `forProfessional`, which calls the patient-scoped endpoint
 * instead of the self-scoped `/me` one. */
export function PatientHandoffButton({ patientId, patientName, forProfessional = false }: Props) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);

  async function download() {
    if (lock.current) return;
    lock.current = true;
    setGenerating(true);
    setError(null);
    try {
      const summary = forProfessional ? await patientHandoffApi.forPatient(patientId) : await patientHandoffApi.me();
      const blob = createHandoffPdf({ summary, patientName });
      downloadHandoffPdf(blob, patientId);
    } catch {
      setError('Não foi possível gerar o resumo. Tente novamente.');
    } finally {
      lock.current = false;
      setGenerating(false);
    }
  }

  return (
    <div className="handoff-pdf-download">
      <button className="button secondary" type="button" disabled={generating} onClick={() => void download()}>
        {generating ? 'Gerando resumo...' : 'Baixar resumo para o médico'}
      </button>
      {generating ? <span className="muted" role="status">Preparando o arquivo...</span> : null}
      {error ? <p className="notice danger" role="alert">{error}</p> : null}
    </div>
  );
}
