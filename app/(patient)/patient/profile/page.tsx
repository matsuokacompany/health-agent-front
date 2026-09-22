'use client';

import { FormEvent, useMemo, useState } from 'react';
import { updatePassword } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePatientData } from '@/components/patient/PatientDataProvider';
import { Button, Card, PageHeader, ReadOnlyField as Field } from '@/components/ui/design';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { usersApi } from '@/services/users';
import { formatBrazilianPhone, toBrazilianPhoneDigits } from '@/lib/phone';

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
}

/** A patient created directly by a professional never went through the
 * self-signup screen that records explicit terms acceptance, so
 * `terms_accepted_at` stays null for them even though they're a real,
 * active user -- fall back to when the account itself was created rather
 * than showing a flat "Não informado" for every professionally-onboarded
 * patient. */
function consentDisplay(user: { terms_accepted_at?: string | null; created_at?: string } | null | undefined) {
  const acceptedAt = formatDate(user?.terms_accepted_at);
  if (acceptedAt) return `Aceito em ${acceptedAt}`;
  const createdAt = formatDate(user?.created_at);
  if (createdAt) return `Não registrado formalmente — conta criada em ${createdAt}`;
  return 'Não informado';
}

export default function PatientProfile() {
  const { user, refreshMe } = useAuth();
  const { plans } = usePatientData();
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [addressMsg, setAddressMsg] = useState('');
  const [addressError, setAddressError] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const professionals = useMemo(() => plans.flatMap((plan) => plan.professionals ?? []).map((professional) => professional.name || professional.specialty || 'Profissional vinculado'), [plans]);

  // These fields reject an empty string server-side (they're optional, but
  // "provided and blank" is invalid, unlike "omitted") -- only send a field
  // once it actually has a value, so saving one field never fails because
  // another one on the same form hasn't been filled in yet.
  function textOrUndefined(value: FormDataEntryValue | null): string | undefined {
    const trimmed = String(value ?? '').trim();
    return trimmed === '' ? undefined : trimmed;
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const f = new FormData(e.currentTarget);
    setSaving(true);
    setError('');
    setMsg('');
    try {
      await usersApi.update(Number(user.id), {
        phone: toBrazilianPhoneDigits(String(f.get('phone') || '')),
        city: textOrUndefined(f.get('city')),
        state: textOrUndefined(f.get('state')),
      });
      await refreshMe();
      setMsg('Telefone, cidade e estado atualizados.');
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function submitAddress(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const f = new FormData(e.currentTarget);
    setSavingAddress(true);
    setAddressError('');
    setAddressMsg('');
    try {
      await usersApi.update(Number(user.id), {
        street: textOrUndefined(f.get('street')),
        neighborhood: textOrUndefined(f.get('neighborhood')),
        zip_code: textOrUndefined(f.get('zip_code')),
        health_plan: textOrUndefined(f.get('health_plan')),
      });
      await refreshMe();
      setAddressMsg('Endereço e convênio atualizados.');
    } catch (err) {
      setAddressError(toFriendlyErrorMessage(err));
    } finally {
      setSavingAddress(false);
    }
  }

  async function submitPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get('password') || '');
    const confirmPassword = String(f.get('confirmPassword') || '');
    setPasswordMsg('');
    setPasswordError('');

    if (password !== confirmPassword) {
      setPasswordError('As senhas não conferem.');
      return;
    }

    setSavingPassword(true);
    try {
      await updatePassword(password);
      e.currentTarget.reset();
      setPasswordMsg('Senha atualizada com sucesso.');
    } catch (err) {
      setPasswordError(toFriendlyErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  }

  return <><PageHeader eyebrow="Perfil" title="Meus dados" description="Confira seus dados cadastrados, atualize seu contato e altere sua senha quando necessário." />
    <div className="profile-layout"><Card className="profile-card" data-tour="profile-personal"><h2>Dados pessoais</h2><div className="form-grid"><Field label="Nome" value={user?.name} /><Field label="CPF" value={user?.cpf} /><Field label="E-mail" value={user?.email} /><Field label="Data de nascimento" value={user?.birth_date} /><Field label="Sexo" value={user?.gender} /></div></Card><form className="profile-card card" data-tour="profile-contact" onSubmit={submit}><h2>Contato editável</h2><label>Telefone<input name="phone" autoComplete="tel" inputMode="tel" defaultValue={formatBrazilianPhone(user?.phone ?? '')} onChange={(event) => { event.currentTarget.value = formatBrazilianPhone(event.currentTarget.value); }} /></label><div className="form-grid"><label>Cidade<input name="city" defaultValue={user?.city ?? ''} /></label><label>Estado<input name="state" defaultValue={user?.state ?? ''} /></label></div><Button type="submit" loading={saving} loadingLabel="Salvando...">Salvar telefone, cidade e estado</Button>{msg ? <p className="notice success">{msg}</p> : null}{error ? <p className="notice danger">{error}</p> : null}</form><form className="profile-card card" data-tour="profile-password" onSubmit={submitPassword}><h2>Alterar senha</h2><p className="muted compact">Defina uma nova senha para sua conta. Use pelo menos 6 caracteres.</p><PasswordInput autoComplete="new-password" label="Nova senha" minLength={6} name="password" required /><PasswordInput autoComplete="new-password" label="Confirmar nova senha" minLength={6} name="confirmPassword" required /><Button type="submit" loading={savingPassword} loadingLabel="Atualizando...">Atualizar senha</Button>{passwordMsg ? <p className="notice success">{passwordMsg}</p> : null}{passwordError ? <p className="notice danger">{passwordError}</p> : null}</form><form className="profile-card card" data-tour="profile-address" onSubmit={submitAddress}><h2>Endereço e convênio</h2><div className="form-grid"><label>Endereço<input name="street" defaultValue={user?.street ?? ''} /></label><label>Bairro<input name="neighborhood" defaultValue={user?.neighborhood ?? ''} /></label><label>CEP<input name="zip_code" defaultValue={user?.zip_code ?? ''} /></label><Field label="Cidade" value={user?.city} /><Field label="Estado" value={user?.state} /><label>Convênio<input name="health_plan" defaultValue={user?.health_plan ?? ''} /></label></div><Button type="submit" loading={savingAddress} loadingLabel="Salvando...">Salvar endereço e convênio</Button>{addressMsg ? <p className="notice success">{addressMsg}</p> : null}{addressError ? <p className="notice danger">{addressError}</p> : null}</form><Card className="profile-card profile-card-full" data-tour="profile-tracking"><h2>Acompanhamento</h2><div className="form-grid"><Field label="Profissional responsável" value={professionals.length ? professionals.join(', ') : 'Não informado'} /><Field label="Consentimento" value={consentDisplay(user)} /></div></Card></div>
  </>;
}
