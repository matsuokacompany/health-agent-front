import { useEffect, useState, type FormEvent } from 'react';
import { Button, Card } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { formatDosageSchedule } from '@/lib/supplementSchedule';
import { supplementsApi } from '@/services/supplements';
import type { Supplement, SupplementDosagePeriod } from '@/lib/types';

type SupplementFormValues = {
  name: string;
  dosageTimes: string;
  dosagePeriod: SupplementDosagePeriod;
  indeterminate: boolean;
  durationDays: string;
};

const EMPTY_FORM: SupplementFormValues = { name: '', dosageTimes: '1', dosagePeriod: 'DAY', indeterminate: true, durationDays: '30' };

function formValuesFromSupplement(supplement: Supplement): SupplementFormValues {
  return {
    name: supplement.name,
    dosageTimes: String(supplement.dosage_times),
    dosagePeriod: supplement.dosage_period,
    indeterminate: supplement.duration_days == null,
    durationDays: supplement.duration_days ? String(supplement.duration_days) : '30',
  };
}

function isSupplementActive(supplement: Supplement) {
  if (supplement.duration_days == null) return true;
  const startedAt = new Date(`${supplement.started_at.slice(0, 10)}T00:00:00`);
  const elapsedDays = Math.floor((Date.now() - startedAt.getTime()) / 86_400_000);
  return elapsedDays < supplement.duration_days;
}

function DosageFields({ values, onChange }: { values: SupplementFormValues; onChange: (values: SupplementFormValues) => void }) {
  return (
    <>
      <label className="supplement-field supplement-field-times">
        Vezes
        <input
          type="number"
          min={1}
          max={99}
          value={values.dosageTimes}
          onChange={(event) => onChange({ ...values, dosageTimes: event.target.value })}
          aria-label="Quantidade de vezes"
        />
      </label>
      <label className="supplement-field supplement-field-period">
        Por
        <select
          value={values.dosagePeriod}
          onChange={(event) => onChange({ ...values, dosagePeriod: event.target.value as SupplementDosagePeriod })}
          aria-label="Período"
        >
          <option value="DAY">Dia</option>
          <option value="WEEK">Semana</option>
          <option value="MONTH">Mês</option>
        </select>
      </label>
      <label className="checkbox-field supplement-field-continuous">
        <input
          type="checkbox"
          checked={values.indeterminate}
          onChange={(event) => onChange({ ...values, indeterminate: event.target.checked })}
        />
        <span>Uso contínuo</span>
      </label>
      {!values.indeterminate ? (
        <label className="supplement-field supplement-field-days">
          Por quantos dias
          <input
            type="number"
            min={1}
            max={3650}
            value={values.durationDays}
            onChange={(event) => onChange({ ...values, durationDays: event.target.value })}
            aria-label="Duração em dias"
          />
        </label>
      ) : null}
    </>
  );
}

export function SupplementsList() {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<SupplementFormValues>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<SupplementFormValues>(EMPTY_FORM);
  const [editSaving, setEditSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    supplementsApi
      .list()
      .then(setSupplements)
      .catch((err) => setError(toFriendlyErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    const trimmed = form.name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      const created = await supplementsApi.create({
        name: trimmed,
        dosage_times: Number(form.dosageTimes) || 1,
        dosage_period: form.dosagePeriod,
        duration_days: form.indeterminate ? null : Number(form.durationDays) || null,
      });
      setSupplements((current) => [...current, created]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function startEditing(supplement: Supplement) {
    setError(null);
    setEditingId(supplement.id);
    setEditForm(formValuesFromSupplement(supplement));
  }

  async function handleSaveEdit(event: FormEvent, id: number) {
    event.preventDefault();
    const trimmed = editForm.name.trim();
    if (!trimmed) return;
    setEditSaving(true);
    setError(null);
    try {
      const updated = await supplementsApi.update(id, {
        name: trimmed,
        dosage_times: Number(editForm.dosageTimes) || 1,
        dosage_period: editForm.dosagePeriod,
        duration_days: editForm.indeterminate ? null : Number(editForm.durationDays) || null,
      });
      setSupplements((current) => current.map((item) => (item.id === id ? updated : item)));
      setEditingId(null);
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setEditSaving(false);
    }
  }

  async function handleRemove(id: number) {
    const previous = supplements;
    setRemovingId(id);
    setError(null);
    setSupplements((current) => current.filter((item) => item.id !== id));
    try {
      await supplementsApi.remove(id);
    } catch (err) {
      setSupplements(previous);
      setError(toFriendlyErrorMessage(err));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Card data-tour="supplements-list">
      <span className="eyebrow">Meus suplementos e remédios</span>
      <h2>O que você toma regularmente</h2>
      <p className="muted">
        Essa lista é sua — quem monta e mantém é você. Se você faz automonitoramento, o check-in diário do WhatsApp usa
        ela para te perguntar especificamente sobre cada um, enquanto o tratamento estiver em curso.
      </p>
      {loading ? (
        <div className="stack compact" aria-busy="true" aria-label="Carregando suplementos">
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
      ) : (
        <div className="supplement-list">
          {supplements.length ? (
            supplements.map((supplement) =>
              editingId === supplement.id ? (
                <form
                  key={supplement.id}
                  className="supplement-item is-editing supplement-form-row"
                  onSubmit={(event) => void handleSaveEdit(event, supplement.id)}
                >
                  <label className="supplement-field supplement-field-name">
                    Nome
                    <input
                      type="text"
                      value={editForm.name}
                      maxLength={120}
                      onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                      aria-label="Nome do suplemento ou remédio"
                    />
                  </label>
                  <DosageFields values={editForm} onChange={setEditForm} />
                  <div className="supplement-edit-actions">
                    <Button type="submit" loading={editSaving} loadingLabel="Salvando..." disabled={!editForm.name.trim()}>
                      Salvar
                    </Button>
                    <Button variant="secondary" onClick={() => setEditingId(null)} disabled={editSaving}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div key={supplement.id} className="supplement-item">
                  <div className="supplement-item-info">
                    <strong>{supplement.name}</strong>
                    <span className="muted compact">
                      {formatDosageSchedule(supplement.dosage_times, supplement.dosage_period, supplement.duration_days)}
                    </span>
                    {!isSupplementActive(supplement) ? (
                      <span className="badge supplement-badge supplement-badge-ended">Tratamento encerrado</span>
                    ) : null}
                  </div>
                  <div className="page-actions">
                    <Button variant="secondary" onClick={() => startEditing(supplement)} disabled={removingId === supplement.id}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      loading={removingId === supplement.id}
                      loadingLabel="Removendo..."
                      onClick={() => void handleRemove(supplement.id)}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ),
            )
          ) : (
            <p className="muted compact">Nenhum suplemento ou remédio cadastrado ainda.</p>
          )}
        </div>
      )}
      {error ? <p className="notice danger">{error}</p> : null}
      <form className="supplement-form-row" onSubmit={(event) => void handleAdd(event)}>
        <label className="supplement-field supplement-field-name">
          Nome
          <input
            type="text"
            placeholder="Ex.: Vitamina D"
            value={form.name}
            maxLength={120}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            aria-label="Nome do suplemento ou remédio"
          />
        </label>
        <DosageFields values={form} onChange={setForm} />
        <Button type="submit" loading={saving} loadingLabel="Adicionando..." disabled={!form.name.trim()}>
          Adicionar
        </Button>
      </form>
    </Card>
  );
}
