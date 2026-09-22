'use client';
import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { dietDocumentApi, dietDocumentError } from '@/services/dietDocument';
import type { DietDocument } from '@/lib/types';
import { Card } from '@/components/ui/design';

/** One active diet-plan PDF per patient -- a new upload replaces it (see
 * DietDocumentService on the backend). Shown on the patient's own anamnese
 * page so it can be referenced in the "resumo para o médico" download. */
export function DietDocumentUpload({ patientId }: { patientId: number }) {
  const [document, setDocument] = useState<DietDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      setDocument(await dietDocumentApi.get(patientId));
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 404)) setError(dietDocumentError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [patientId]);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      setDocument(await dietDocumentApi.upload(patientId, file));
      setSuccess('Plano alimentar salvo.');
    } catch (err) {
      setError(dietDocumentError(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      await dietDocumentApi.remove(patientId);
      setDocument(null);
      setSuccess('Plano alimentar removido.');
    } catch (err) {
      setError(dietDocumentError(err));
    } finally {
      setUploading(false);
    }
  }

  async function handleView() {
    setError(null);
    try {
      const { url } = await dietDocumentApi.view(patientId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(dietDocumentError(err));
    }
  }

  return (
    <Card className="diet-document-upload" data-tour="diet-document">
      <span className="eyebrow">Plano alimentar</span>
      <h2>Dieta em PDF</h2>
      <p className="muted compact">
        Anexe seu plano alimentar em PDF para incluir no resumo que você pode baixar e levar ao médico.
      </p>
      {loading ? (
        <p className="muted compact">Carregando...</p>
      ) : document ? (
        <div className="diet-document-current">
          <span>{document.original_filename}</span>
          <div className="diet-document-actions">
            <button className="button secondary" type="button" onClick={() => void handleView()} disabled={uploading}>Visualizar</button>
            <button className="button secondary" type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>Substituir</button>
            <button className="button secondary" type="button" onClick={() => void handleRemove()} disabled={uploading}>Remover</button>
          </div>
        </div>
      ) : (
        <button className="button secondary" type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? 'Enviando...' : 'Enviar plano alimentar (PDF)'}
        </button>
      )}
      <input ref={fileInputRef} type="file" accept="application/pdf" className="sr-only" onChange={(event) => void handleFile(event)} />
      {error ? <p className="notice danger" role="alert">{error}</p> : null}
      {success ? <p className="notice success" role="status">{success}</p> : null}
    </Card>
  );
}
