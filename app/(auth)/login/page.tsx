'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

type LoginMode = 'patient' | 'professional';

const loginOptions = {
  patient: {
    label: 'Paciente',
    description: 'Acompanhe check-ins, calendário e relatórios pessoais.',
    placeholder: 'paciente@email.com',
    target: '/patient/dashboard' as const,
  },
  professional: {
    label: 'Profissional',
    description: 'Gerencie pacientes, monitoramentos e avaliações clínicas.',
    placeholder: 'profissional@clinica.com',
    target: '/professional/patients' as const,
  },
} as const satisfies Record<LoginMode, { label: string; description: string; placeholder: string; target: '/patient/dashboard' | '/professional/patients' }>;

export default function Login() {
  const router = useRouter();
  const { signIn, error } = useAuth();
  const [mode, setMode] = useState<LoginMode>('patient');
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
      const isAdmin = me.roles.includes('admin') || me.roles.includes('super_admin');
      const isProfessional = me.roles.includes('professional');
      const isPatient = me.roles.includes('patient');

      if (isAdmin) router.replace('/admin');
      else if (mode === 'professional' && isProfessional) router.replace(loginOptions.professional.target);
      else if (mode === 'patient' && isPatient) router.replace(loginOptions.patient.target);
      else router.replace(isProfessional ? loginOptions.professional.target : loginOptions.patient.target);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="hero login-hero">
      <section className="login-copy">
        <span className="eyebrow">Julha Saúde</span>
        <h1>Operação clínica segura, clara e conectada.</h1>
        <p className="muted">Entre no workspace médico para acompanhar pacientes, check-ins e permissões com uma experiência premium inspirada em sistemas hospitalares modernos.</p>
        <div className="grid">
          <article className="card"><span className="badge">JWT Supabase</span><h3>Autenticação protegida</h3><p className="muted">A senha é enviada apenas ao Supabase; o FastAPI recebe o token no Authorization.</p></article>
          <article className="card"><span className="badge">RBAC</span><h3>Perfis clínicos</h3><p className="muted">Paciente, profissional, admin e super admin mantêm jornadas separadas.</p></article>
        </div>
      </section>
      <aside className="panel login-panel">
        <span className="badge">Acesso ao produto</span>
        <h2>Entrar</h2>
        <p className="muted">Escolha seu tipo de acesso e use suas credenciais para acessar o ambiente clínico.</p>
        <div className="login-switch" role="tablist" aria-label="Tipo de acesso">
          {Object.entries(loginOptions).map(([key, option]) => (
            <button key={key} className={mode === key ? 'is-active' : ''} type="button" role="tab" aria-selected={mode === key} onClick={() => setMode(key as LoginMode)}>
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
        <form onSubmit={onSubmit}>
          <label>
            E-mail
            <input autoComplete="email" name="email" onChange={(event) => setEmail(event.target.value)} placeholder={loginOptions[mode].placeholder} required type="email" value={email} />
          </label>
          <label>
            Senha
            <input autoComplete="current-password" name="password" onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required type="password" value={password} />
          </label>
          {(formError || error) ? <p className="notice danger">{formError ?? error}</p> : null}
          <button className="button" disabled={submitting} type="submit">{submitting ? 'Entrando...' : `Entrar como ${loginOptions[mode].label.toLowerCase()}`}</button>
          <p><a href="/forgot-password">Esqueci minha senha</a></p>
        </form>
      </aside>
    </main>
  );
}
