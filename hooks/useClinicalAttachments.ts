'use client';
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { clinicalAttachmentError, clinicalAttachmentsApi, type ClinicalAttachment } from '@/services/clinicalAttachments';
export function useClinicalAttachments(patientId?: number) {
  const [items, setItems] = useState<ClinicalAttachment[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null); const [uploadsDisabled, setUploadsDisabled] = useState(false);
  const reload = useCallback(async () => { if (!patientId) { setLoading(false); return; } setLoading(true); setError(null); try { setItems((await clinicalAttachmentsApi.list(patientId)).filter((item) => item.status === 'AVAILABLE')); } catch (err) { setError(clinicalAttachmentError(err, 'list')); } finally { setLoading(false); } }, [patientId]);
  useEffect(() => { void reload(); }, [reload]);
  const upload = useCallback(async (files: File[], description?: string, dailyReportId?: number) => { if (!patientId) throw new Error('Paciente inválido'); try { const result = await clinicalAttachmentsApi.upload(patientId, files, description, dailyReportId); await reload(); return result; } catch (err) { if (err instanceof ApiError && err.status === 503) setUploadsDisabled(true); throw err; } }, [patientId, reload]);
  const remove = useCallback(async (id: number) => { try { await clinicalAttachmentsApi.remove(id); setItems((current) => current.filter((item) => item.id !== id)); } catch (err) { if (err instanceof ApiError && err.status === 404) setItems((current) => current.filter((item) => item.id !== id)); throw err; } }, []);
  return { items, loading, error, uploadsDisabled, reload, upload, remove };
}
