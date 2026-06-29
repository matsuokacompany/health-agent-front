'use client';
import Link from 'next/link';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { recoverSessionFromUrl, updatePassword } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      recoverSessionFromUrl();
      setReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Link de redefinição inválido ou expirado.');
    }
  }, []);

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
      setMessage('Senha alterada com sucesso. Você já pode entrar com a nova senha.');
      window.setTimeout(() => router.replace('/login'), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível alterar a senha.');
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
          <label>
            Nova senha
            <input autoComplete="new-password" disabled={!ready || submitting} minLength={6} name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </label>
          <label>
            Confirmar nova senha
            <input autoComplete="new-password" disabled={!ready || submitting} minLength={6} name="confirmPassword" onChange={(event) => setConfirmPassword(event.target.value)} required type="password" value={confirmPassword} />
          </label>
          {message ? <p className="notice success">{message}</p> : null}
          {error ? <p className="notice danger">{error}</p> : null}
          <button className="button" disabled={!ready || submitting} type="submit">{submitting ? 'Alterando...' : 'Alterar senha'}</button>
          <Link href="/login">Voltar ao login</Link>
        </form>
      </section>
    </main>
  );
}
