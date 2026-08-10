'use client';

import { useRef, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Modal } from '@/components/ui/Modal';
import { adminAiReportsApi, cooldownReleaseErrorMessage } from '@/services/adminAiReports';

const SUCCESS = 'Relatório de Apoio à avaliação clínica liberado com sucesso. O paciente já pode realizar uma nova geração.';

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value));
}

export function ExceptionalReportRelease({ patientId, patientName, patientEmail, nextGenerationAt, onReleased }: { patientId: number; patientName: string; patientEmail: string; nextGenerationAt?: string | null; onReleased?: () => void | Promise<void> }) {
  const { isSuperAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [released, setReleased] = useState(false);
  const submitting = useRef(false);
  if (!isSuperAdmin) return null;

  async function confirm() {
    if (submitting.current || released) return;
    submitting.current = true;
    setLoading(true);
    setMessage(null);
    try {
      await adminAiReportsApi.releaseClinicalCooldown(patientId);
      setReleased(true);
      setOpen(false);
      setMessage(SUCCESS);
      await onReleased?.();
    } catch (error) {
      setMessage(cooldownReleaseErrorMessage(error));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  }

  const nextDate = formatDate(nextGenerationAt);
  return <>
    <section className="card" aria-labelledby="exceptional-release-title">
      <h2 id="exceptional-release-title">Liberação excepcional de relatório</h2>
      <p className="muted">Libere uma nova geração antes do término da janela de 30 dias.</p>
      <button type="button" disabled={loading || released} onClick={() => { setMessage(null); setOpen(true); }}>{released ? 'Relatório liberado' : 'Liberar Apoio à avaliação clínica'}</button>
    </section>
    {message ? <p className={`notice ${released ? 'success' : 'danger'}`} role="status">{message}</p> : null}
    <Modal open={open} title="Liberar relatório" onClose={() => { if (!loading) setOpen(false); }}>
      <div className="stack">
        <p>Esta ação permitirá que o paciente gere imediatamente um novo relatório de Apoio à avaliação clínica, mesmo que a janela de 30 dias ainda não tenha terminado. Após a próxima geração, uma nova janela de 30 dias será iniciada. Deseja continuar?</p>
        <dl><div><dt>Paciente</dt><dd>{patientName}</dd></div><div><dt>E-mail</dt><dd>{patientEmail}</dd></div><div><dt>Modalidade</dt><dd>Apoio à avaliação clínica</dd></div>{nextDate ? <div><dt>Próxima geração atual</dt><dd>{nextDate}</dd></div> : null}</dl>
        <div className="page-actions"><button className="button secondary" type="button" disabled={loading} onClick={() => setOpen(false)}>Cancelar</button><button className="button" type="button" disabled={loading} aria-busy={loading} onClick={confirm}>{loading ? 'Liberando...' : 'Liberar relatório'}</button></div>
      </div>
    </Modal>
  </>;
}
