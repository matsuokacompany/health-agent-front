'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/design';
import { ListSkeleton } from '@/components/ui/Loading';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import type { MonitoringPlan } from '@/lib/types';
import { monitoringApi } from '@/services/monitoring';

export default function Page() {
  const id = Number(useParams()?.id);
  const [plans, setPlans] = useState<MonitoringPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try { setPlans(await monitoringApi.listPatientPlans(id)); }
    catch { setPlans([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (id && !Number.isNaN(id)) void load(); }, [id]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get('name') || '').trim();
    if (!name) return;
    setSaving(true); setError('');
    try { await monitoringApi.createPlan({ patient_id: id, name, active: true }); (e.target as HTMLFormElement).reset(); await load(); }
    catch (err) { setError(toFriendlyErrorMessage(err)); }
    finally { setSaving(false); }
  }

  if (!id || Number.isNaN(id)) return <><h1>Paciente não encontrado</h1></>;

  return <><h1>Monitoramento</h1><form className="card" onSubmit={submit}><label>Nome do plano<input name="name" required /></label><Button type="submit" loading={saving} loadingLabel="Criando...">Criar plano</Button></form>{error ? <p className="notice danger">{error}</p> : null}{loading ? <ListSkeleton /> : plans.length === 0 ? <p>Nenhum plano encontrado.</p> : plans.map((p) => <article className="card" key={p.id}>{p.name ?? 'Plano de acompanhamento'}</article>)}</>;
}
