'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/design';
import { ListSkeleton } from '@/components/ui/Loading';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { INPUT_LIMITS, validateUserText } from '@/lib/clinicalInput';
import type { MonitoringPlan } from '@/lib/types';
import { monitoringApi } from '@/services/monitoring';

type PlanForm = { title: string; description: string; start_date: string; end_date: string; active: boolean };
type PlanErrors = Partial<Record<keyof PlanForm, string>>;
const emptyPlan: PlanForm = { title: '', description: '', start_date: '', end_date: '', active: true };

function dateValue(value?: string | null) { return value ? value.slice(0, 10) : ''; }
function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${value.slice(0, 10)}T12:00:00`)) : 'Não informado'; }
function planForm(plan: MonitoringPlan): PlanForm { return { title: plan.title ?? plan.name ?? '', description: plan.description ?? '', start_date: dateValue(plan.start_date ?? plan.starts_at), end_date: dateValue(plan.end_date ?? plan.ends_at), active: plan.active ?? String(plan.status ?? '').toLowerCase() !== 'inactive' }; }

export default function Page() {
  const id = Number(useParams()?.id);
  const [plans, setPlans] = useState<MonitoringPlan[]>([]);
  const [form, setForm] = useState<PlanForm>(emptyPlan);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<PlanErrors>({});
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

  function setValue<K extends keyof PlanForm>(name: K, value: PlanForm[K]) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function validate() {
    const next: PlanErrors = {};
    if (!form.title.trim()) next.title = 'Informe a finalidade do acompanhamento.';
    const descriptionError = validateUserText(form.description, INPUT_LIMITS.planDescription);
    if (descriptionError) next.description = descriptionError;
    if (form.start_date && form.end_date && form.end_date < form.start_date) next.end_date = 'A data final não pode ser anterior à data inicial.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true); setError('');
    const payload = { patient_id: id, title: form.title.trim(), description: form.description.trim() || undefined, start_date: form.start_date || undefined, end_date: form.end_date || undefined, active: form.active };
    try {
      if (editingId) await monitoringApi.updatePlan(editingId, payload);
      else await monitoringApi.createPlan(payload);
      setForm(emptyPlan); setEditingId(null); await load();
    } catch (err) { setError(toFriendlyErrorMessage(err)); }
    finally { setSaving(false); }
  }

  function edit(plan: MonitoringPlan) { setEditingId(plan.id); setForm(planForm(plan)); setErrors({}); setError(''); }
  function cancelEdit() { setEditingId(null); setForm(emptyPlan); setErrors({}); }
  const describedBy = (base: string, field: keyof PlanErrors) => errors[field] ? `${base} ${field}-error` : base;

  if (!id || Number.isNaN(id)) return <><h1>Paciente não encontrado</h1></>;

  return <><h1>Monitoramento</h1><form className="card stack" onSubmit={submit} noValidate>
    <h2>Plano de acompanhamento</h2>
    <label htmlFor="plan-title">Finalidade do acompanhamento <span aria-hidden="true">*</span><input id="plan-title" name="title" required maxLength={INPUT_LIMITS.planTitle} value={form.title} onChange={(event) => setValue('title', event.target.value)} placeholder="Ex.: Acompanhar a recuperação após extração de terceiro molar" aria-invalid={Boolean(errors.title)} aria-describedby={describedBy('plan-title-help', 'title')} /><small className="muted" id="plan-title-help">Descreva, em uma frase, o principal objetivo deste acompanhamento.</small>{errors.title ? <span className="field-error" id="title-error" role="alert">{errors.title}</span> : null}</label>
    <label htmlFor="plan-description">Contexto clínico e pontos a acompanhar<textarea id="plan-description" name="description" rows={5} maxLength={INPUT_LIMITS.planDescription} value={form.description} onChange={(event) => setValue('description', event.target.value)} placeholder="Ex.: Pós-operatório de extração realizada em 12/08. Acompanhar dor, inchaço, sangramento, alimentação, abertura da boca e possíveis sinais de infecção." aria-invalid={Boolean(errors.description)} aria-describedby={describedBy('plan-description-help plan-description-count', 'description')} /><small className="muted" id="plan-description-help">Inclua o contexto necessário, procedimento ou tratamento relacionado, evolução esperada e os sinais que merecem acompanhamento. Não informe nome, CPF, telefone, endereço ou outros dados pessoais.</small><small className="muted" id="plan-description-count">{form.description.length}/{INPUT_LIMITS.planDescription}</small>{errors.description ? <span className="field-error" id="description-error" role="alert">{errors.description}</span> : null}</label>
    <p className="notice plan-ai-notice">As informações deste plano organizam o acompanhamento e podem contextualizar relatórios de apoio gerados por IA. Eles não substituem a avaliação do profissional.</p>
    <div className="new-patient-grid"><label>Período de acompanhamento<input type="date" value={form.start_date} onChange={(event) => setValue('start_date', event.target.value)} /></label><label>Data final<input type="date" min={form.start_date || undefined} value={form.end_date} onChange={(event) => setValue('end_date', event.target.value)} aria-invalid={Boolean(errors.end_date)} aria-describedby={errors.end_date ? 'end_date-error' : undefined} />{errors.end_date ? <span className="field-error" id="end_date-error" role="alert">{errors.end_date}</span> : null}</label></div>
    <label>Situação<select value={form.active ? 'active' : 'inactive'} onChange={(event) => setValue('active', event.target.value === 'active')}><option value="active">Ativo</option><option value="inactive">Inativo</option></select></label>
    {error ? <p className="notice danger" role="alert">{error}</p> : null}<div className="modal-actions">{editingId ? <Button type="button" variant="secondary" onClick={cancelEdit}>Cancelar edição</Button> : null}<Button type="submit" loading={saving} loadingLabel={editingId ? 'Salvando...' : 'Criando...'}>{editingId ? 'Salvar alterações' : 'Criar plano'}</Button></div>
  </form>{loading ? <ListSkeleton /> : plans.length === 0 ? <p>Nenhum plano encontrado.</p> : <section className="stack" aria-label="Planos de acompanhamento">{plans.map((plan) => <article className="card" key={plan.id}><div className="page-actions"><div><h2>Finalidade do acompanhamento</h2><p>{plan.title ?? plan.name ?? 'Não informada'}</p></div><Button type="button" variant="secondary" onClick={() => edit(plan)}>Editar plano</Button></div><h3>Contexto clínico e pontos a acompanhar</h3><p>{plan.description || 'Não informado'}</p><dl className="patient-info-list"><div><dt>Período</dt><dd>{formatDate(plan.start_date ?? plan.starts_at)} — {formatDate(plan.end_date ?? plan.ends_at)}</dd></div><div><dt>Situação</dt><dd>{plan.active ?? String(plan.status ?? '').toLowerCase() !== 'inactive' ? 'Ativo' : 'Inativo'}</dd></div>{plan.professionals?.length ? <div><dt>Profissional responsável</dt><dd>{plan.professionals.map((professional) => professional.name ?? 'Não informado').join(', ')}</dd></div> : null}</dl></article>)}</section>}</>;
}
