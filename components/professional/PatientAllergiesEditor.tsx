'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { PencilSimple, Trash, Warning } from '@phosphor-icons/react';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { Button } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { createPatientAllergy, deletePatientAllergy, getPatientAllergies, updatePatientAllergy } from '@/services/professional';
import type { Allergy, AllergySeverity } from '@/lib/types';

function friendlyError(error: unknown) {
  if (error instanceof ApiError && error.status === 403) return 'Você não possui acesso à lista de alergias deste paciente.';
  return 'Não foi possível salvar. Tente novamente.';
}

const SEVERITY_LABELS: Record<AllergySeverity, string> = { LEVE: 'Leve', MODERADA: 'Moderada', GRAVE: 'Grave', RISCO_DE_MORTE: 'Risco de morte' };
const SEVERITY_TONE: Record<AllergySeverity, string> = { LEVE: 'risk-baixo', MODERADA: 'risk-moderado', GRAVE: 'risk-alto', RISCO_DE_MORTE: 'risk-alto' };

type AllergyFormValues = { allergen: string; severity: AllergySeverity };
const EMPTY_FORM: AllergyFormValues = { allergen: '', severity: 'MODERADA' };

function SeverityField({ values, onChange }: { values: AllergyFormValues; onChange: (values: AllergyFormValues) => void }) {
  return (
    <label className="supplement-field supplement-field-severity">
      Intensidade
      <select value={values.severity} onChange={(event) => onChange({ ...values, severity: event.target.value as AllergySeverity })} aria-label="Intensidade da alergia">
        <option value="LEVE">Leve</option>
        <option value="MODERADA">Moderada</option>
        <option value="GRAVE">Grave</option>
        <option value="RISCO_DE_MORTE">Risco de morte</option>
      </select>
    </label>
  );
}

function SeverityBadge({ severity }: { severity: AllergySeverity }) {
  return (
    <span className={`badge ${SEVERITY_TONE[severity]}`}>
      {severity === 'RISCO_DE_MORTE' ? <Warning aria-hidden="true" size={14} weight="fill" /> : null}
      {SEVERITY_LABELS[severity]}
    </span>
  );
}

export function PatientAllergiesEditor({ patientId }: { patientId: string }) {
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<AllergyFormValues>(EMPTY_FORM);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<AllergyFormValues>(EMPTY_FORM);
  const [editSaving, setEditSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    getPatientAllergies(patientId)
      .then(setAllergies)
      .catch((err) => setError(friendlyError(err)))
      .finally(() => setLoading(false));
  }, [patientId]);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    const trimmed = form.allergen.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createPatientAllergy(patientId, { allergen: trimmed, severity: form.severity });
      setAllergies((current) => [...current, created]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  function startEditing(allergy: Allergy) {
    setError(null);
    setEditingId(allergy.id);
    setEditForm({ allergen: allergy.allergen, severity: allergy.severity });
  }

  async function handleSaveEdit(event: FormEvent, id: number) {
    event.preventDefault();
    const trimmed = editForm.allergen.trim();
    if (!trimmed) return;
    setEditSaving(true);
    setError(null);
    try {
      const updated = await updatePatientAllergy(patientId, id, { allergen: trimmed, severity: editForm.severity });
      setAllergies((current) => current.map((item) => (item.id === id ? updated : item)));
      setEditingId(null);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setEditSaving(false);
    }
  }

  async function handleRemove(id: number) {
    const previous = allergies;
    setRemovingId(id);
    setError(null);
    setAllergies((current) => current.filter((item) => item.id !== id));
    try {
      await deletePatientAllergy(patientId, id);
    } catch (err) {
      setAllergies(previous);
      setError(friendlyError(err));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="card professional-detail-section">
      <div className="professional-section-heading">
        <div>
          <h2>Alergias</h2>
          <p className="muted compact">
            Cadastre cada alergia com a intensidade da reação. Uma alergia com risco de morte fica destacada.
          </p>
        </div>
      </div>
      {loading ? (
        <div className="stack compact" aria-busy="true" aria-label="Carregando alergias">
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
      ) : (
        <div className="supplement-list">
          {allergies.length ? (
            allergies.map((allergy) =>
              editingId === allergy.id ? (
                <form key={allergy.id} className="supplement-item is-editing supplement-form-row" onSubmit={(event) => void handleSaveEdit(event, allergy.id)}>
                  <label className="supplement-field supplement-field-allergen">
                    Alergia a
                    <input
                      type="text"
                      value={editForm.allergen}
                      maxLength={120}
                      onChange={(event) => setEditForm({ ...editForm, allergen: event.target.value })}
                      aria-label="Nome da alergia"
                    />
                  </label>
                  <SeverityField values={editForm} onChange={setEditForm} />
                  <div className="supplement-edit-actions">
                    <Button type="submit" loading={editSaving} loadingLabel="Salvando..." disabled={!editForm.allergen.trim()}>Salvar</Button>
                    <Button variant="secondary" onClick={() => setEditingId(null)} disabled={editSaving}>Cancelar</Button>
                  </div>
                </form>
              ) : (
                <div key={allergy.id} className="supplement-item">
                  <div className="supplement-item-info">
                    <strong>{allergy.allergen}</strong>
                    <SeverityBadge severity={allergy.severity} />
                  </div>
                  <div className="page-actions">
                    <button type="button" className="button secondary icon-button" onClick={() => startEditing(allergy)} disabled={removingId === allergy.id} aria-label="Editar alergia" title="Editar">
                      <PencilSimple aria-hidden="true" size={16} />
                    </button>
                    <button type="button" className="button ghost icon-button" onClick={() => void handleRemove(allergy.id)} disabled={removingId === allergy.id} aria-label="Remover alergia" title="Remover">
                      {removingId === allergy.id ? <span className="spinner" aria-hidden="true" /> : <Trash aria-hidden="true" size={16} />}
                    </button>
                  </div>
                </div>
              ),
            )
          ) : (
            <p className="muted compact">Nenhuma alergia cadastrada ainda.</p>
          )}
        </div>
      )}
      {error ? <p className="notice danger" role="alert">{error}</p> : null}
      <form className="supplement-form-row" onSubmit={(event) => void handleAdd(event)}>
        <label className="supplement-field supplement-field-allergen">
          Alergia a
          <input
            type="text"
            placeholder="Ex.: Frutos do mar"
            value={form.allergen}
            maxLength={120}
            onChange={(event) => setForm({ ...form, allergen: event.target.value })}
            aria-label="Nome da alergia"
          />
        </label>
        <SeverityField values={form} onChange={setForm} />
        <Button type="submit" loading={saving} loadingLabel="Adicionando..." disabled={!form.allergen.trim()}>
          Adicionar
        </Button>
      </form>
    </section>
  );
}
