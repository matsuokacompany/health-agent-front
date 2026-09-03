'use client';

import { FormEvent, useState } from 'react';
import { updatePassword } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button, Card, PageHeader, ReadOnlyField as Field } from '@/components/ui/design';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { usersApi } from '@/services/users';
import { formatBrazilianPhone, toBrazilianPhoneDigits } from '@/lib/phone';

export default function ProfessionalProfile() {
  const { user, refreshMe } = useAuth();
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    const f = new FormData(e.currentTarget);
    setSaving(true);
    setError('');
    setMsg('');
    try {
      await usersApi.update(Number(user.id), { phone: toBrazilianPhoneDigits(String(f.get('phone') || '')), city: String(f.get('city') || ''), state: String(f.get('state') || '') });
      await refreshMe();
      setMsg('Telefone, cidade e estado atualizados.');
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
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

  return <><PageHeader eyebrow="👤 Perfil" title="Meus dados" description="Confira seus dados cadastrados, atualize seu contato e altere sua senha quando necessário." />
    <div className="profile-layout">
      <Card className="profile-card">
        <h2>Dados pessoais</h2>
        <div className="form-grid">
          <Field label="Nome" value={user?.name} />
          <Field label="CPF" value={user?.cpf} />
          <Field label="E-mail" value={user?.email} />
        </div>
      </Card>
      <form className="profile-card card" onSubmit={submit}>
        <h2>Contato editável</h2>
        <label>Telefone<input name="phone" autoComplete="tel" inputMode="tel" defaultValue={formatBrazilianPhone(user?.phone ?? '')} onChange={(event) => { event.currentTarget.value = formatBrazilianPhone(event.currentTarget.value); }} /></label>
        <div className="form-grid">
          <label>Cidade<input name="city" defaultValue={user?.city ?? ''} /></label>
          <label>Estado<input name="state" defaultValue={user?.state ?? ''} /></label>
        </div>
        <Button type="submit" loading={saving} loadingLabel="Salvando...">Salvar telefone, cidade e estado</Button>
        {msg ? <p className="notice success">{msg}</p> : null}
        {error ? <p className="notice danger">{error}</p> : null}
      </form>
      <form className="profile-card card" onSubmit={submitPassword}>
        <h2>Alterar senha</h2>
        <p className="muted compact">Defina uma nova senha para sua conta. Use pelo menos 6 caracteres.</p>
        <PasswordInput autoComplete="new-password" label="Nova senha" minLength={6} name="password" required />
        <PasswordInput autoComplete="new-password" label="Confirmar nova senha" minLength={6} name="confirmPassword" required />
        <Button type="submit" loading={savingPassword} loadingLabel="Atualizando...">Atualizar senha</Button>
        {passwordMsg ? <p className="notice success">{passwordMsg}</p> : null}
        {passwordError ? <p className="notice danger">{passwordError}</p> : null}
      </form>
    </div>
  </>;
}
