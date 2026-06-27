'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Login() {
  const router = useRouter();
  const { signIn, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const me = await signIn(email, password);
      if (me.roles.includes('super_admin')) router.replace('/choose-context');
      else if (me.roles.includes('professional')) router.replace('/professional');
      else if (me.roles.includes('patient')) router.replace('/patient');
      else setFormError('Usuário autenticado, mas sem contexto de acesso configurado.');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-hero">
      <aside className="panel login-panel" aria-labelledby="login-title">
        <div className="login-heading">
          <h1 id="login-title">Entrar</h1>
          <p className="muted">Use suas credenciais para acessar a plataforma. O ambiente será definido automaticamente pelo seu perfil.</p>
        </div>
        <form className="login-form" onSubmit={onSubmit}>
          <div className="login-fields">
            <label>
              E-mail
              <input autoComplete="email" name="email" onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" required type="email" value={email} />
            </label>
            <label>
              Senha
              <input autoComplete="current-password" name="password" onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required type="password" value={password} />
            </label>
          </div>
          {(formError || error) ? <p className="notice danger">{formError ?? error}</p> : null}
          <div className="login-actions">
            <button className="button" disabled={submitting} type="submit">{submitting ? 'Entrando...' : 'Entrar'}</button>
            <a href="/forgot-password">Esqueci minha senha</a>
          </div>
        </form>
      </aside>
    </main>
  );
}
