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
      await signIn(email, password);
      router.replace('/app');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="hero">
      <section>
        <span className="eyebrow">Julha Saúde</span>
        <h1>Operação clínica segura, clara e conectada.</h1>
        <p className="muted">Entre no workspace médico para acompanhar pacientes, check-ins e permissões com uma experiência premium inspirada em sistemas hospitalares modernos.</p>
        <div className="grid">
          <article className="card"><span className="badge">JWT Supabase</span><h3>Autenticação protegida</h3><p className="muted">A senha é enviada apenas ao Supabase; o FastAPI recebe o token no Authorization.</p></article>
          <article className="card"><span className="badge">RBAC</span><h3>Perfis clínicos</h3><p className="muted">Paciente, profissional, admin e super admin mantêm jornadas separadas.</p></article>
        </div>
      </section>
      <aside className="panel">
        <span className="badge">Acesso ao produto</span>
        <h2>Entrar</h2>
        <p className="muted">Use suas credenciais para acessar o ambiente clínico.</p>
        <form onSubmit={onSubmit}>
          <label>
            E-mail
            <input autoComplete="email" name="email" onChange={(event) => setEmail(event.target.value)} placeholder="profissional@clinica.com" required type="email" value={email} />
          </label>
          <label>
            Senha
            <input autoComplete="current-password" name="password" onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required type="password" value={password} />
          </label>
          {(formError || error) ? <p className="notice danger">{formError ?? error}</p> : null}
          <button className="button" disabled={submitting} type="submit">{submitting ? 'Entrando...' : 'Entrar no workspace'}</button>
          <p><a href="/forgot-password">Esqueci minha senha</a></p>
        </form>
      </aside>
    </main>
  );
}
