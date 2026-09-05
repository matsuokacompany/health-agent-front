'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { Button } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { formatDosageSchedule } from '@/lib/supplementSchedule';
import { createPatientSupplement, deletePatientSupplement, getPatientSupplements } from '@/services/professional';
import type { Supplement, SupplementDosagePeriod } from '@/lib/types';

function friendlyError(error: unknown) {
  if (error instanceof ApiError && error.status === 403) return 'Você não possui acesso à lista de medicamentos deste paciente.';
  return 'Não foi possível salvar. Tente novamente.';
}

export function PatientSupplementsEditor({ patientId }: { patientId: string }) {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [dosageTimes, setDosageTimes] = useState('1');
  const [dosagePeriod, setDosagePeriod] = useState<SupplementDosagePeriod>('DAY');
  const [indeterminate, setIndeterminate] = useState(true);
  const [durationDays, setDurationDays] = useState('30');

  useEffect(() => {
    setLoading(true);
    getPatientSupplements(patientId)
      .then(setSupplements)
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false));
  }, [patientId]);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createPatientSupplement(patientId, {
        name: trimmed,
        dosage_times: Number(dosageTimes) || 1,
        dosage_period: dosagePeriod,
        duration_days: indeterminate ? null : Number(durationDays) || null,
      });
      setSupplements((current) => [...current, created]);
      setName('');
      setDosageTimes('1');
      setDosagePeriod('DAY');
      setIndeterminate(true);
      setDurationDays('30');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: number) {
    const previous = supplements;
    setSupplements((current) => current.filter((item) => item.id !== id));
    try {
      await deletePatientSupplement(patientId, id);
    } catch (err) {
      setSupplements(previous);
      setError(friendlyError(err));
    }
  }

  return (
    <section className="card professional-detail-section">
      <div className="professional-section-heading">
        <div>
          <h2>Medicamentos e suplementos</h2>
          <p className="muted compact">O check-in diário do WhatsApp pergunta especificamente sobre cada um, enquanto o tratamento estiver em curso.</p>
        </div>
      </div>
      {loading ? (
        <div className="stack compact" aria-busy="true" aria-label="Carregando medicamentos">
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
      ) : (
        <div className="stack compact">
          {supplements.length ? (
            supplements.map((supplement) => (
              <div key={supplement.id} className="list-row">
                <span>
                  {supplement.name}
                  <br />
                  <span className="muted compact">
                    {formatDosageSchedule(supplement.dosage_times, supplement.dosage_period, supplement.duration_days)}
                  </span>
                </span>
                <Button variant="ghost" onClick={() => void handleRemove(supplement.id)}>Remover</Button>
              </div>
            ))
          ) : (
            <p className="muted compact">Nenhum medicamento ou suplemento cadastrado ainda.</p>
          )}
        </div>
      )}
      {error ? <p className="notice danger" role="alert">{error}</p> : null}
      <form className="stack compact" onSubmit={(event) => void handleAdd(event)}>
        <input
          type="text"
          placeholder="Ex.: Amoxicilina"
          value={name}
          maxLength={120}
          onChange={(event) => setName(event.target.value)}
          aria-label="Nome do medicamento ou suplemento"
        />
        <div className="page-actions">
          <label>
            Quantas vezes
            <input type="number" min={1} max={99} value={dosageTimes} onChange={(event) => setDosageTimes(event.target.value)} aria-label="Quantidade de vezes" />
          </label>
          <label>
            Por
            <select value={dosagePeriod} onChange={(event) => setDosagePeriod(event.target.value as SupplementDosagePeriod)} aria-label="Período">
              <option value="DAY">Dia</option>
              <option value="WEEK">Semana</option>
              <option value="MONTH">Mês</option>
            </select>
          </label>
        </div>
        <div className="page-actions">
          <label>
            <input type="checkbox" checked={indeterminate} onChange={(event) => setIndeterminate(event.target.checked)} />
            {' '}Uso contínuo (sem data para parar)
          </label>
          {!indeterminate ? (
            <label>
              Por quantos dias
              <input type="number" min={1} max={3650} value={durationDays} onChange={(event) => setDurationDays(event.target.value)} aria-label="Duração em dias" />
            </label>
          ) : null}
        </div>
        <Button type="submit" loading={saving} loadingLabel="Adicionando..." disabled={!name.trim()}>
          Adicionar
        </Button>
      </form>
    </section>
  );
}
