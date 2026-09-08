'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { Button, Card } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { INPUT_LIMITS, normalizeUserText, validateUserText } from '@/lib/clinicalInput';
import { anamnesesApi } from '@/services/anamnese';
import type { Anamnese } from '@/lib/types';

function friendlyError(error: unknown) {
  if (error instanceof ApiError && error.status === 403) return 'Você não pode mais editar sua anamnese por conta própria -- fale com seu profissional.';
  return 'Não foi possível salvar. O texto foi mantido; tente novamente.';
}

export function SelfAnamneseEditor() {
  const [anamnese, setAnamnese] = useState('');
  const [savedText, setSavedText] = useState('');
  const [record, setRecord] = useState<Anamnese | null>(null);
  const [hasAnamnese, setHasAnamnese] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const currentText = useRef('');
  currentText.current = anamnese;

  async function load(preserveDraft = false) {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await anamnesesApi.me();
      setRecord(data);
      setHasAnamnese(true);
      const text = String(data.info ?? '');
      setSavedText(text);
      if (!preserveDraft) setAnamnese(text);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setRecord(null);
        setHasAnamnese(false);
      } else {
        setLoadError('Não foi possível carregar sua anamnese. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (currentText.current !== savedText) event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [savedText]);

  async function save() {
    if (saving) return;
    const normalized = normalizeUserText(anamnese);
    if (!normalized.trim()) { setSaveError('Escreva algo antes de salvar.'); return; }
    const validationError = validateUserText(normalized, INPUT_LIMITS.anamnesis);
    if (validationError) { setSaveError(validationError); return; }
    setSaving(true);
    setSaveError(null);
    setSuccess(null);
    try {
      const updated = hasAnamnese
        ? await anamnesesApi.updateMe({ info: normalized.trim() })
        : await anamnesesApi.create({ info: normalized.trim() });
      setRecord(updated);
      setHasAnamnese(true);
      setAnamnese(String(updated.info ?? ''));
      setSavedText(String(updated.info ?? ''));
      setSuccess(hasAnamnese ? 'Anamnese atualizada.' : 'Anamnese salva.');
    } catch (error) {
      if (error instanceof ApiError && error.status === 404 && hasAnamnese) {
        setHasAnamnese(false);
        setRecord(null);
        setSaveError('Sua anamnese não existe mais. O texto foi mantido; salve novamente para criá-la.');
      } else if (error instanceof ApiError && error.status === 409 && !hasAnamnese) {
        await load(true);
        setSaveError('Você já tinha uma anamnese salva. Os dados foram recarregados e você já pode editá-la.');
      } else {
        setSaveError(friendlyError(error));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card data-tour="anamnese-card">
      <span className="eyebrow">Sua anamnese</span>
      <h2>{hasAnamnese ? 'Seu histórico de saúde' : 'Conte um pouco sobre sua saúde'}</h2>
      <p className="muted">
        Como você faz automonitoramento sem um profissional vinculado, você mesmo preenche e mantém sua anamnese.
        Registre queixa principal, histórico clínico, antecedentes, medicamentos, alergias e demais observações relevantes.
      </p>
      <label>
        Conteúdo
        <div className="anamnesis-textarea-shell">
          <textarea
            rows={12}
            maxLength={INPUT_LIMITS.anamnesis}
            value={anamnese}
            onChange={(event) => setAnamnese(event.target.value)}
            disabled={loading || saving || Boolean(loadError)}
            aria-busy={loading}
          />
          {loading ? (
            <div className="anamnesis-loading" role="status" aria-label="Carregando anamnese">
              <SkeletonBlock /><SkeletonBlock /><SkeletonBlock /><SkeletonBlock />
              <span className="sr-only">Carregando anamnese...</span>
            </div>
          ) : null}
        </div>
      </label>
      <p className="muted compact">
        {loading ? <SkeletonBlock className="anamnesis-help-skeleton" /> : `${anamnese.length.toLocaleString('pt-BR')} / ${INPUT_LIMITS.anamnesis.toLocaleString('pt-BR')} caracteres.`}
      </p>
      <Button onClick={() => void save()} loading={saving} loadingLabel="Salvando..." disabled={loading || Boolean(loadError)}>
        {hasAnamnese ? 'Salvar alterações' : 'Salvar anamnese'}
      </Button>
      {loadError ? (
        <p className="notice danger" role="alert">
          {loadError} <button type="button" className="button secondary" onClick={() => void load()}>Tentar novamente</button>
        </p>
      ) : null}
      {saveError ? <p className="notice danger" role="alert">{saveError}</p> : null}
      {success ? <p className="notice success" role="status">{success}</p> : null}
      {record?.updated_at ? (
        <small className="muted">Atualizada em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(String(record.updated_at)))}</small>
      ) : null}
    </Card>
  );
}
