'use client';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import Link from 'next/link';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { recoverSessionFromUrl, updatePassword } from '@/lib/supabase';
import { PasswordInput } from '@/components/ui/PasswordInput';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const minimumPasswordLength = 10;
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      recoverSessionFromUrl();
      setReady(true);
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    }
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < minimumPasswordLength) {
      setError(`A senha deve ter pelo menos ${minimumPasswordLength} caracteres.`);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    setSubmitting(true);
    try {
      await updatePassword(password);
      setMessage('Senha alterada com sucesso. Você já pode entrar com a nova senha.');
      window.setTimeout(() => router.replace('/login'), 1800);
    } catch (err) {
      setError(toFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="hero">
      <section>
        <span className="badge">Nova senha</span>
        <h1>Redefinir senha</h1>
        <p className="muted">Digite uma nova senha para concluir a recuperação do seu acesso.</p>
        <form className="card" onSubmit={onSubmit}>
          <PasswordInput autoComplete="new-password" disabled={!ready || submitting} label="Nova senha" minLength={minimumPasswordLength} name="password" onChange={(event) => setPassword(event.target.value)} required value={password} />
          <PasswordInput autoComplete="new-password" disabled={!ready || submitting} label="Confirmar nova senha" minLength={minimumPasswordLength} name="confirmPassword" onChange={(event) => setConfirmPassword(event.target.value)} required value={confirmPassword} />
          {message ? <p className="notice success">{message}</p> : null}
          {error ? <p className="notice danger">{error}</p> : null}
          <button className="button" disabled={!ready || submitting} type="submit">{submitting ? 'Alterando...' : 'Alterar senha'}</button>
          <Link href="/login">Voltar ao login</Link>
        </form>
      </section>
    </main>
  );
}
