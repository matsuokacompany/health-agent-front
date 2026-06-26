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
    <main className="login-hero">
      <aside className="panel login-panel" aria-labelledby="login-title">
        <div className="login-heading">
          <h1 id="login-title">Entrar</h1>
          <p className="muted">Escolha seu tipo de acesso e use suas credenciais para acessar o ambiente clínico.</p>
        </div>
        <div className="login-switch" role="tablist" aria-label="Tipo de acesso">
          {Object.entries(loginOptions).map(([key, option]) => (
            <button key={key} className={mode === key ? 'is-active' : ''} type="button" role="tab" aria-selected={mode === key} onClick={() => setMode(key as LoginMode)}>
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
        <form className="login-form" onSubmit={onSubmit}>
          <div className="login-fields">
            <label>
              E-mail
              <input autoComplete="email" name="email" onChange={(event) => setEmail(event.target.value)} placeholder={loginOptions[mode].placeholder} required type="email" value={email} />
            </label>
            <label>
              Senha
              <input autoComplete="current-password" name="password" onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required type="password" value={password} />
            </label>
          </div>
          {(formError || error) ? <p className="notice danger">{formError ?? error}</p> : null}
          <div className="login-actions">
            <button className="button" disabled={submitting} type="submit">{submitting ? 'Entrando...' : `Entrar como ${loginOptions[mode].label.toLowerCase()}`}</button>
            <a href="/forgot-password">Esqueci minha senha</a>
          </div>
        </form>
      </aside>
    </main>
  );
}
