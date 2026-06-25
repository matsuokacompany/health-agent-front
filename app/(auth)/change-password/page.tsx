'use client';

import { FormEvent, useState } from 'react';
import { RequireAuth } from '@/components/auth/guards';
import { updatePassword } from '@/lib/supabase';

function ChangePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password);
      setPassword('');
      setConfirmPassword('');
      setMessage('Senha alterada com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível alterar a senha.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <div className="topbar"><span className="badge">Segurança</span><a href="/app">Voltar</a></div>
      <h1>Alterar senha</h1>
      <p className="muted">Cadastre uma nova senha para sua conta autenticada no Supabase.</p>
      <form className="card" onSubmit={onSubmit}>
        <label>
          Nova senha
          <input autoComplete="new-password" minLength={6} name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
        </label>
        <label>
          Confirmar nova senha
          <input autoComplete="new-password" minLength={6} name="confirmPassword" onChange={(event) => setConfirmPassword(event.target.value)} required type="password" value={confirmPassword} />
        </label>
        {message ? <p className="notice success">{message}</p> : null}
        {error ? <p className="notice danger">{error}</p> : null}
        <button className="button" disabled={submitting} type="submit">{submitting ? 'Alterando...' : 'Alterar senha'}</button>
      </form>
    </main>
  );
}

export default function ChangePasswordPage() {
  return <RequireAuth><ChangePasswordForm /></RequireAuth>;
}
