'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { createPatientAnamnese, getPatientAnamnese, updatePatientAnamnese, type Anamnese } from '@/services/professional';
import { Button } from '@/components/ui/design';

function friendlyError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'Você não possui acesso à anamnese deste paciente.';
    if (error.status === 422) {
      const payload = error.payload as { detail?: string; message?: string } | undefined;
      return payload?.detail ?? payload?.message ?? 'Revise o conteúdo informado.';
    }
  }
  return 'Não foi possível salvar a anamnese. O texto foi mantido; tente novamente.';
}

export function PatientAnamneseEditor({ patientId }: { patientId: string }) {
  const [anamnese, setAnamnese] = useState('');
  const [savedText, setSavedText] = useState('');
  const [record, setRecord] = useState<Anamnese | null>(null);
  const [hasAnamnese, setHasAnamnese] = useState(false);
  const [isLoadingAnamnese, setIsLoadingAnamnese] = useState(true);
  const [isSavingAnamnese, setIsSavingAnamnese] = useState(false);
  const [anamneseError, setAnamneseError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const currentText = useRef('');
  currentText.current = anamnese;

  async function load(preserveDraft = false) {
    setIsLoadingAnamnese(true); setAnamneseError(null);
    try {
      const data = await getPatientAnamnese(patientId);
      setRecord(data); setHasAnamnese(Boolean(data));
      const text = data?.info ?? '';
      setSavedText(text);
      if (!preserveDraft) setAnamnese(text);
    } catch (error) {
      setAnamneseError(error instanceof ApiError && error.status === 403 ? 'Você não possui acesso à anamnese deste paciente.' : 'Não foi possível carregar a anamnese. Tente novamente.');
    } finally { setIsLoadingAnamnese(false); }
  }

  useEffect(() => { void load(); }, [patientId]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (currentText.current !== savedText) event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [savedText]);

  async function save() {
    if (isSavingAnamnese) return;
    if (!anamnese.trim()) { setSaveError('Informe o conteúdo da anamnese antes de salvar.'); return; }
    setIsSavingAnamnese(true); setSaveError(null); setSuccess(null);
    try {
      const updated = hasAnamnese
        ? await updatePatientAnamnese(patientId, { info: anamnese.trim() })
        : await createPatientAnamnese(patientId, { info: anamnese.trim() });
      setRecord(updated); setHasAnamnese(true); setAnamnese(updated.info); setSavedText(updated.info);
      setSuccess(hasAnamnese ? 'Anamnese atualizada com sucesso.' : 'Anamnese cadastrada com sucesso.');
    } catch (error) {
      if (error instanceof ApiError && error.status === 404 && hasAnamnese) {
        setHasAnamnese(false); setRecord(null);
        setSaveError('A anamnese não existe mais. O texto foi mantido; tente salvar novamente para cadastrá-la.');
      } else if (error instanceof ApiError && error.status === 409 && !hasAnamnese) {
        await load(true);
        setSaveError('A anamnese já foi cadastrada. Os dados foram recarregados e você já pode editá-la.');
      } else setSaveError(friendlyError(error));
    } finally { setIsSavingAnamnese(false); }
  }

  return <section className="card professional-detail-section"><div className="professional-section-heading"><div><h2>Anamnese</h2><p className="muted compact">{hasAnamnese ? 'Registro clínico do paciente.' : 'Este paciente ainda não possui anamnese.'}</p></div>{record?.updated_at ? <small className="muted">Atualizada em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(record.updated_at))}</small> : null}</div>
    {isLoadingAnamnese ? <p className="muted" role="status">Carregando anamnese...</p> : <><label>Conteúdo clínico<textarea rows={12} value={anamnese} onChange={(event) => setAnamnese(event.target.value)} disabled={isSavingAnamnese || Boolean(anamneseError)} /></label><p className="muted compact">Registre queixa principal, histórico clínico, antecedentes, medicamentos, alergias e demais observações relevantes.</p><Button onClick={save} loading={isSavingAnamnese} loadingLabel="Salvando..." disabled={Boolean(anamneseError)}>Salvar anamnese</Button></>}
    {anamneseError ? <p className="notice danger" role="alert">{anamneseError} <button type="button" className="button secondary" onClick={() => void load()}>Tentar novamente</button></p> : null}
    {saveError ? <p className="notice danger" role="alert">{saveError}</p> : null}{success ? <p className="notice success" role="status">{success}</p> : null}
  </section>;
}
