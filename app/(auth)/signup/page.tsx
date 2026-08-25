'use client';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import Link from 'next/link';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { formatBrazilianPhone, toBrazilianPhoneDigits } from '@/lib/phone';

// Keep this in sync with the date at the top of docs/legal/termos-de-uso.md
// in the backend repo — the backend records exactly this string alongside
// terms_accepted_at, so it must match the version actually being linked here.
const TERMS_VERSION = '2026-08-25';

export default function Signup() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(formatBrazilianPhone(''));
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationPending, setConfirmationPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const result = await signUp({
        name,
        email,
        password,
        phone: toBrazilianPhoneDigits(phone),
        terms_accepted: termsAccepted,
        terms_version: TERMS_VERSION,
      });
      if (result.status === 'confirmation_pending') setConfirmationPending(true);
      else router.replace('/patient');
    } catch (err) {
      setFormError(toFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmationPending) {
    return (
      <main className="login-hero">
        <aside className="panel login-panel" aria-labelledby="signup-title">
          <div className="login-heading">
            <h1 id="signup-title">Verifique seu e-mail</h1>
            <p className="muted">Enviamos um link de confirmação para {email}. Clique nele para ativar sua conta e continuar.</p>
          </div>
          <Link href="/login">Voltar para o login</Link>
        </aside>
      </main>
    );
  }

  return (
    <main className="login-hero">
      <aside className="panel login-panel" aria-labelledby="signup-title">
        <div className="login-heading">
          <h1 id="signup-title">Criar conta</h1>
          <p className="muted">Cadastre-se para acompanhar seus próprios sintomas e sua evolução ao longo do tempo.</p>
        </div>
        <form className="login-form" onSubmit={onSubmit}>
          <div className="login-fields">
            <label>
              Nome completo
              <input autoComplete="name" name="name" onChange={(event) => setName(event.target.value)} placeholder="Seu nome" required type="text" value={name} />
            </label>
            <label>
              E-mail
              <input autoComplete="email" name="email" onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" required type="email" value={email} />
            </label>
            <PasswordInput autoComplete="new-password" label="Senha" minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 8 caracteres" required value={password} />
            <label>
              Telefone (WhatsApp)
              <input
                autoComplete="tel"
                inputMode="tel"
                name="phone"
                onChange={(event) => setPhone(formatBrazilianPhone(event.target.value))}
                placeholder="+55 (11) 91234-5678"
                required
                type="tel"
                value={phone}
              />
            </label>
            <label className="checkbox-field">
              <input checked={termsAccepted} name="terms_accepted" onChange={(event) => setTermsAccepted(event.target.checked)} required type="checkbox" />
              <span>
                {/* TODO: point these at the real published URLs once the institutional
                    site (a separate repo) has the Termos de Uso / Política de
                    Privacidade pages live — plain <a>, not next/link, since these
                    likely live on a different domain than app.julha.com.br. */}
                Li e concordo com os{' '}
                <a href="/termos-de-uso" rel="noopener noreferrer" target="_blank">Termos de Uso</a> e a{' '}
                <a href="/politica-de-privacidade" rel="noopener noreferrer" target="_blank">Política de Privacidade</a>.
              </span>
            </label>
          </div>
          {formError ? <p className="notice danger">{formError}</p> : null}
          <div className="login-actions">
            <button className="button" disabled={submitting} type="submit">{submitting ? 'Criando conta...' : 'Criar conta'}</button>
            <Link href="/login">Já tenho conta</Link>
          </div>
        </form>
      </aside>
    </main>
  );
}
