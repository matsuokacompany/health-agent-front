import { useEffect, useState, type FormEvent } from 'react';
import { Warning } from '@phosphor-icons/react';
import { Button, Card } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { allergiesApi } from '@/services/allergies';
import type { Allergy, AllergySeverity } from '@/lib/types';

const SEVERITY_LABELS: Record<AllergySeverity, string> = { LEVE: 'Leve', MODERADA: 'Moderada', GRAVE: 'Grave', RISCO_DE_MORTE: 'Risco de morte' };
// LEVE/MODERADA/GRAVE reuse the same tone scale as risk badges elsewhere in
// the app; RISCO_DE_MORTE stays on the "alto" (danger) tone too but gets an
// icon on top so a severe, life-threatening allergy (e.g. anaphylaxis to
// shellfish) reads as unmistakably more serious than a merely "grave" one.
const SEVERITY_TONE: Record<AllergySeverity, string> = { LEVE: 'risk-baixo', MODERADA: 'risk-moderado', GRAVE: 'risk-alto', RISCO_DE_MORTE: 'risk-alto' };

type AllergyFormValues = { allergen: string; severity: AllergySeverity };
const EMPTY_FORM: AllergyFormValues = { allergen: '', severity: 'MODERADA' };

function SeverityField({ value, onChange }: { value: AllergySeverity; onChange: (value: AllergySeverity) => void }) {
  return (
    <label className="supplement-field supplement-field-period">
      Intensidade
      <select value={value} onChange={(event) => onChange(event.target.value as AllergySeverity)} aria-label="Intensidade da alergia">
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

export function AllergiesList() {
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<AllergyFormValues>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<AllergyFormValues>(EMPTY_FORM);
  const [editSaving, setEditSaving] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    allergiesApi
      .list()
      .then(setAllergies)
      .catch((err) => setError(toFriendlyErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    const trimmed = form.allergen.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      const created = await allergiesApi.create({ allergen: trimmed, severity: form.severity });
      setAllergies((current) => [...current, created]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
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
      const updated = await allergiesApi.update(id, { allergen: trimmed, severity: editForm.severity });
      setAllergies((current) => current.map((item) => (item.id === id ? updated : item)));
      setEditingId(null);
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
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
      await allergiesApi.remove(id);
    } catch (err) {
      setAllergies(previous);
      setError(toFriendlyErrorMessage(err));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Card data-tour="allergies-list">
      <span className="eyebrow">Minhas alergias</span>
      <h2>O que você sabe que tem alergia</h2>
      <p className="muted">
        Essa lista é sua — cadastre cada alergia com a intensidade da reação. Uma alergia com risco de morte (ex.:
        anafilaxia a frutos do mar) fica destacada, para que qualquer profissional que veja seu histórico perceba
        isso de imediato.
      </p>
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
                <form
                  key={allergy.id}
                  className="supplement-item is-editing supplement-form-row"
                  onSubmit={(event) => void handleSaveEdit(event, allergy.id)}
                >
                  <label className="supplement-field supplement-field-name">
                    Alergia a
                    <input
                      type="text"
                      value={editForm.allergen}
                      maxLength={120}
                      onChange={(event) => setEditForm({ ...editForm, allergen: event.target.value })}
                      aria-label="Nome da alergia"
                    />
                  </label>
                  <SeverityField value={editForm.severity} onChange={(severity) => setEditForm({ ...editForm, severity })} />
                  <div className="supplement-edit-actions">
                    <Button type="submit" loading={editSaving} loadingLabel="Salvando..." disabled={!editForm.allergen.trim()}>
                      Salvar
                    </Button>
                    <Button variant="secondary" onClick={() => setEditingId(null)} disabled={editSaving}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div key={allergy.id} className="supplement-item">
                  <div className="supplement-item-info">
                    <strong>{allergy.allergen}</strong>
                    <SeverityBadge severity={allergy.severity} />
                  </div>
                  <div className="page-actions">
                    <Button variant="secondary" onClick={() => startEditing(allergy)} disabled={removingId === allergy.id}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      loading={removingId === allergy.id}
                      loadingLabel="Removendo..."
                      onClick={() => void handleRemove(allergy.id)}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ),
            )
          ) : (
            <p className="muted compact">Nenhuma alergia cadastrada ainda.</p>
          )}
        </div>
      )}
      {error ? <p className="notice danger">{error}</p> : null}
      <form className="supplement-form-row" onSubmit={(event) => void handleAdd(event)}>
        <label className="supplement-field supplement-field-name">
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
        <SeverityField value={form.severity} onChange={(severity) => setForm({ ...form, severity })} />
        <Button type="submit" loading={saving} loadingLabel="Adicionando..." disabled={!form.allergen.trim()}>
          Adicionar
        </Button>
      </form>
    </Card>
  );
}
