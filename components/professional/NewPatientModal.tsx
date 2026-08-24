'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/infrastructure/http/ApiClient';
import { useCreateProfessionalPatient } from '@/hooks/useProfessional';
import type { CreateProfessionalPatientRequest } from '@/services/professional';
import { createPatientAnamnese } from '@/services/professional';
import { Button } from '@/components/ui/design';
import { Modal } from '@/components/ui/Modal';
import { INPUT_LIMITS, normalizeUserText, validateUserText } from '@/lib/clinicalInput';
import { formatBrazilianPhone } from '@/lib/phone';

type FormValues = Record<keyof CreateProfessionalPatientRequest, string>;
type FieldErrors = Partial<Record<keyof FormValues, string>>;
const initialValues: FormValues = { name: '', email: '', phone: '', cpf: '', birth_date: '', gender: '', city: '', state: '', plan_title: '', plan_description: '', plan_start_date: '', plan_end_date: '' };
const fieldNames = new Set(Object.keys(initialValues));

function apiMessage(payload: unknown) {
  if (typeof payload === 'string') return payload;
  if (!payload || typeof payload !== 'object') return null;
  const value = payload as { detail?: unknown; message?: unknown };
  return typeof (value.detail ?? value.message) === 'string' ? String(value.detail ?? value.message) : null;
}

function validationErrors(payload: unknown): FieldErrors {
  if (!payload || typeof payload !== 'object') return {};
  const detail = (payload as { detail?: unknown }).detail;
  if (!Array.isArray(detail)) return {};
  const errors: FieldErrors = {};
  detail.forEach((item: unknown) => {
    if (!item || typeof item !== 'object') return;
    const { loc, msg } = item as { loc?: unknown[]; msg?: unknown };
    const name = loc?.at(-1);
    if (typeof name === 'string' && fieldNames.has(name) && typeof msg === 'string') errors[name as keyof FormValues] = msg;
  });
  return errors;
}

export function toCreatePatientPayload(values: FormValues): CreateProfessionalPatientRequest {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()])) as CreateProfessionalPatientRequest;
}

export function NewPatientModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const submitting = useRef(false);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [anamnese, setAnamnese] = useState('');
  const [isSavingAnamnese, setIsSavingAnamnese] = useState(false);
  const mutation = useCreateProfessionalPatient({
    onError: (error) => {
      if (!(error instanceof ApiError)) return setErrorMessage('Não foi possível cadastrar o paciente. Tente novamente.');
      if (error.status === 403) return setErrorMessage('É necessário possuir um perfil profissional ativo para cadastrar pacientes.');
      if (error.status === 409) return setErrorMessage(apiMessage(error.payload) ?? error.message);
      if (error.status === 422) {
        const mapped = validationErrors(error.payload);
        setErrors(mapped);
        return setErrorMessage(Object.keys(mapped).length ? 'Revise os campos indicados.' : apiMessage(error.payload) ?? 'Revise os dados informados.');
      }
      if (error.status === 400) return setErrorMessage(apiMessage(error.payload) ?? 'Verifique as datas do plano.');
      if (error.status === 500) return setErrorMessage('Não foi possível cadastrar o paciente. Tente novamente.');
      setErrorMessage(error.message);
    },
  });

  function setValue(name: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const next: FieldErrors = {};
    if (!values.name.trim()) next.name = 'Informe o nome completo.';
    if (!values.email.trim()) next.email = 'Informe o e-mail.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = 'Informe um e-mail válido.';
    if (!values.plan_title.trim()) next.plan_title = 'Informe o título do plano.';
    const limits: Partial<Record<keyof FormValues, number>> = { name: INPUT_LIMITS.name, phone: INPUT_LIMITS.phone, cpf: INPUT_LIMITS.cpf, gender: INPUT_LIMITS.gender, city: INPUT_LIMITS.city, state: INPUT_LIMITS.state, plan_title: INPUT_LIMITS.planTitle, plan_description: INPUT_LIMITS.planDescription };
    Object.entries(limits).forEach(([name, limit]) => {
      const validationError = validateUserText(values[name as keyof FormValues], limit);
      if (validationError) next[name as keyof FormValues] = validationError;
    });
    const normalizedAnamnese = normalizeUserText(anamnese);
    const anamneseValidationError = validateUserText(normalizedAnamnese, INPUT_LIMITS.anamnesis);
    if (anamneseValidationError) setErrorMessage(`Anamnese: ${anamneseValidationError}`);
    if (values.plan_start_date && values.plan_end_date && values.plan_end_date < values.plan_start_date) next.plan_end_date = 'A data final não pode ser anterior à data inicial.';
    setErrors(next); if (!anamneseValidationError) setErrorMessage('');
    if (Object.keys(next).length || anamneseValidationError) return;
    submitting.current = true;
    try {
      const response = await mutation.mutateAsync(toCreatePatientPayload(values));
      const patientId = response.patient.id;
      if (normalizedAnamnese.trim()) {
        setIsSavingAnamnese(true);
        try {
          await createPatientAnamnese(patientId, { info: normalizedAnamnese.trim() });
        } catch {
          router.push(`/professional/patients/${patientId}?created=1&anamneseError=1`);
          onClose();
          return;
        } finally { setIsSavingAnamnese(false); }
      }
      onClose();
      router.push(`/professional/patients/${patientId}?created=1`);
    } catch { /* The mutation displays API errors without clearing values. */ }
    finally { submitting.current = false; }
  }

  const input = (name: keyof FormValues, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, formatValue = (value: string) => value) => <label>{label}{errors[name] ? <span className="field-error" id={`${name}-error`}>{errors[name]}</span> : null}<input {...props} name={name} value={values[name]} onChange={(event) => setValue(name, formatValue(event.target.value))} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : undefined} /></label>;
  return <Modal open={open} title="Novo paciente" onClose={() => { if (!mutation.isPending && !isSavingAnamnese) onClose(); }}><form onSubmit={submit} noValidate>
    <p className="muted">Cadastre o paciente e crie seu plano inicial de acompanhamento.</p>
    <div className="new-patient-grid">{input('name', 'Nome completo *', { autoComplete: 'name', required: true, maxLength: INPUT_LIMITS.name })}{input('email', 'E-mail *', { autoComplete: 'email', type: 'email', required: true })}{input('phone', 'Telefone', { autoComplete: 'tel', inputMode: 'tel', maxLength: INPUT_LIMITS.phone, placeholder: '+55 (11) 99999-9999' }, formatBrazilianPhone)}{input('cpf', 'CPF', { inputMode: 'numeric', maxLength: INPUT_LIMITS.cpf })}{input('birth_date', 'Data de nascimento', { type: 'date' })}<label>Gênero<select name="gender" value={values.gender} onChange={(event) => setValue('gender', event.target.value)}><option value="">Não informado</option><option value="feminino">Feminino</option><option value="masculino">Masculino</option><option value="nao_binario">Não binário</option><option value="outro">Outro</option></select></label>{input('city', 'Cidade', { autoComplete: 'address-level2', maxLength: INPUT_LIMITS.city })}{input('state', 'Estado', { autoComplete: 'address-level1', maxLength: INPUT_LIMITS.state, placeholder: 'Estado' })}</div>
    <h3 className="new-patient-section-title">Plano de acompanhamento</h3>{input('plan_title', 'Título do plano *', { required: true, maxLength: INPUT_LIMITS.planTitle })}<label>Descrição do plano<textarea name="plan_description" rows={3} maxLength={INPUT_LIMITS.planDescription} value={values.plan_description} onChange={(event) => setValue('plan_description', event.target.value)} /><small className="muted">{values.plan_description.length.toLocaleString('pt-BR')} / {INPUT_LIMITS.planDescription.toLocaleString('pt-BR')} caracteres</small></label>
    <div className="new-patient-grid">{input('plan_start_date', 'Data inicial do plano', { type: 'date' })}{input('plan_end_date', 'Data final do plano', { type: 'date', min: values.plan_start_date || undefined })}</div>
    <h3 className="new-patient-section-title">Anamnese</h3><label>Anamnese<textarea name="anamnese" rows={8} maxLength={INPUT_LIMITS.anamnesis} value={anamnese} onChange={(event) => setAnamnese(event.target.value)} placeholder="Registre as informações clínicas relevantes." /><small className="muted">{anamnese.length.toLocaleString('pt-BR')} / {INPUT_LIMITS.anamnesis.toLocaleString('pt-BR')} caracteres. Registre a queixa principal, histórico clínico, antecedentes, medicamentos, alergias e demais observações relevantes.</small></label>
    {errorMessage ? <p className="notice danger" role="alert">{errorMessage}</p> : null}<div className="modal-actions"><Button variant="secondary" onClick={onClose} disabled={mutation.isPending || isSavingAnamnese}>Cancelar</Button><Button type="submit" loading={mutation.isPending || isSavingAnamnese} loadingLabel={isSavingAnamnese ? 'Salvando anamnese...' : 'Cadastrando...'}>Cadastrar paciente</Button></div>
  </form></Modal>;
}
