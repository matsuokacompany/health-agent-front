import { useEffect, useState, type FormEvent } from 'react';
import { Button, Card } from '@/components/ui/design';
import { SkeletonBlock } from '@/components/ui/Skeleton';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { supplementsApi } from '@/services/supplements';
import type { Supplement } from '@/lib/types';

export function SupplementsList() {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supplementsApi
      .list()
      .then(setSupplements)
      .catch((err) => setError(toFriendlyErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    try {
      const created = await supplementsApi.create(trimmed);
      setSupplements((current) => [...current, created]);
      setName('');
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: number) {
    const previous = supplements;
    setSupplements((current) => current.filter((item) => item.id !== id));
    try {
      await supplementsApi.remove(id);
    } catch (err) {
      setSupplements(previous);
      setError(toFriendlyErrorMessage(err));
    }
  }

  return (
    <Card>
      <span className="eyebrow">Meus suplementos e remédios</span>
      <h2>O que você toma regularmente</h2>
      <p className="muted">
        Essa lista é sua — quem monta e mantém é você. Se você faz automonitoramento, o check-in diário do WhatsApp usa
        ela para te perguntar especificamente sobre cada um.
      </p>
      {loading ? (
        <div className="stack compact" aria-busy="true" aria-label="Carregando suplementos">
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
      ) : (
        <div className="stack compact">
          {supplements.length ? (
            supplements.map((supplement) => (
              <div key={supplement.id} className="list-row">
                <span>{supplement.name}</span>
                <Button variant="ghost" onClick={() => void handleRemove(supplement.id)}>Remover</Button>
              </div>
            ))
          ) : (
            <p className="muted compact">Nenhum suplemento ou remédio cadastrado ainda.</p>
          )}
        </div>
      )}
      {error ? <p className="notice danger">{error}</p> : null}
      <form className="page-actions" onSubmit={(event) => void handleAdd(event)}>
        <input
          type="text"
          placeholder="Ex.: Vitamina D"
          value={name}
          maxLength={120}
          onChange={(event) => setName(event.target.value)}
          aria-label="Nome do suplemento ou remédio"
        />
        <Button type="submit" loading={saving} loadingLabel="Adicionando..." disabled={!name.trim()}>
          Adicionar
        </Button>
      </form>
    </Card>
  );
}
