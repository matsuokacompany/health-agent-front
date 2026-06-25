'use client';

import { FormEvent, useState } from 'react';
import { resetPasswordForEmail } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      await resetPasswordForEmail(email);
      setMessage('Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível solicitar a redefinição de senha.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="hero">
      <section>
        <span className="badge">Recuperação de acesso</span>
        <h1>Esqueci minha senha</h1>
        <p className="muted">Informe seu e-mail para receber o link seguro de redefinição de senha pelo Supabase Auth.</p>
        <form className="card" onSubmit={onSubmit}>
          <label>
            E-mail
            <input autoComplete="email" name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          {message ? <p className="notice success">{message}</p> : null}
          {error ? <p className="notice danger">{error}</p> : null}
          <button className="button" disabled={submitting} type="submit">{submitting ? 'Enviando...' : 'Enviar link de redefinição'}</button>
          <a href="/login">Voltar ao login</a>
        </form>
      </section>
      <aside className="panel">
        <h2>Como funciona?</h2>
        <p>O link enviado por e-mail abre a tela de redefinição para você cadastrar uma nova senha sem compartilhar a senha antiga.</p>
      </aside>
    </main>
  );
}
