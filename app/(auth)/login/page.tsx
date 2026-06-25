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
        <span className="badge">Julha Saúde</span>
        <h1>Entrar com Supabase Auth</h1>
        <p className="muted">A senha é enviada apenas ao Supabase. O FastAPI recebe somente o JWT Supabase no header Authorization.</p>
        <form className="card" onSubmit={onSubmit}>
          <label>
            E-mail
            <input autoComplete="email" name="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          <label>
            Senha
            <input autoComplete="current-password" name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </label>
          {(formError || error) ? <p className="danger">{formError ?? error}</p> : null}
          <button className="button" disabled={submitting} type="submit">{submitting ? 'Entrando...' : 'Entrar'}</button>
        </form>
      </section>
      <aside className="panel">
        <h2>Fluxo seguro</h2>
        <p>Após o login, o frontend chama GET /api/auth/me para carregar o usuário local e suas roles.</p>
      </aside>
    </main>
  );
}
