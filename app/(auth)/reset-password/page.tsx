'use client';
import { toFriendlyErrorMessage } from '@/components/ui/errors';
import Link from 'next/link';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { exchangePasswordRecovery, updatePassword } from '@/lib/supabase';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { AuthLogo } from '@/components/ui/AuthLogo';

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
    async function prepareRecoverySession() {
      // This Supabase project issues recovery links in the implicit flow
      // (#access_token=...&refresh_token=...) rather than the PKCE flow
      // (?code=...) -- confirmed against a real link. Handle both: whichever
      // one Supabase actually sends, exchange it for our own session cookies
      // via the same backend endpoint.
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const code = new URLSearchParams(window.location.search).get('code');
      const recoveryError = hashParams.get('error') || hashParams.get('error_code');

      if (recoveryError && !accessToken && !code) {
        // Supabase itself denied the link (expired/used/invalid) and redirected
        // here with #error=access_denied&error_code=otp_expired&... instead of
        // a token or code. There is no session to exchange in this case --
        // showing the form anyway let the user submit a password change with
        // no session, which the backend correctly rejected with 401.
        window.history.replaceState(null, document.title, window.location.pathname);
        const description = hashParams.get('error_description');
        setError(description ? decodeURIComponent(description.replace(/\+/g, ' ')) : 'Link de redefinição inválido ou expirado. Solicite um novo link.');
        return;
      }

      try {
        if (accessToken && refreshToken) {
          const expiresIn = Number(hashParams.get('expires_in'));
          await exchangePasswordRecovery({ access_token: accessToken, refresh_token: refreshToken, expires_in: Number.isFinite(expiresIn) ? expiresIn : undefined });
          window.history.replaceState(null, document.title, window.location.pathname);
        } else if (code) {
          await exchangePasswordRecovery({ code });
          window.history.replaceState(null, document.title, window.location.pathname);
        }
        setReady(true);
      } catch (err) {
        setError(toFriendlyErrorMessage(err));
      }
    }

    void prepareRecoverySession();
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
    <main className="login-hero">
      <aside className="panel login-panel" aria-labelledby="reset-password-title">
        <div className="login-heading">
          <AuthLogo />
          <span className="badge">Nova senha</span>
          <h1 id="reset-password-title">Redefinir senha</h1>
          <p className="muted">Digite uma nova senha para concluir a recuperação do seu acesso.</p>
        </div>
        <form className="login-form" onSubmit={onSubmit}>
          <div className="login-fields">
            <PasswordInput autoComplete="new-password" disabled={!ready || submitting} label="Nova senha" minLength={minimumPasswordLength} name="password" onChange={(event) => setPassword(event.target.value)} required value={password} />
            <PasswordInput autoComplete="new-password" disabled={!ready || submitting} label="Confirmar nova senha" minLength={minimumPasswordLength} name="confirmPassword" onChange={(event) => setConfirmPassword(event.target.value)} required value={confirmPassword} />
          </div>
          {message ? <p className="notice success">{message}</p> : null}
          {error ? <p className="notice danger">{error}</p> : null}
          <div className="login-actions">
            <button className="button" disabled={!ready || submitting} type="submit">{submitting ? 'Alterando...' : 'Alterar senha'}</button>
            <Link href="/login">Voltar ao login</Link>
          </div>
        </form>
      </aside>
    </main>
  );
}
