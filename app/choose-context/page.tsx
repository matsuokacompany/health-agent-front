'use client';

import { useRouter } from 'next/navigation';
import { RequireSuperAdmin } from '@/components/auth/guards';
import { type AccessContext, accessContextLabels, useAuth } from '@/components/auth/AuthProvider';

const options: Array<{ context: AccessContext; href: '/admin' | '/professional' | '/patient'; description: string }> = [
  { context: 'admin', href: '/admin', description: 'Gerenciar usuários, operações e configurações administrativas.' },
  { context: 'professional', href: '/professional', description: 'Acessar a experiência clínica de profissional de saúde.' },
  { context: 'patient', href: '/patient', description: 'Visualizar a plataforma pela experiência do paciente.' },
];

function ChooseContextContent() {
  const router = useRouter();
  const { setActiveAccessContext } = useAuth();

  function choose(context: AccessContext, href: '/admin' | '/professional' | '/patient') {
    setActiveAccessContext(context);
    router.replace(href);
  }

  return (
    <main className="login-hero">
      <section className="panel login-panel" aria-labelledby="context-title">
        <div className="login-heading">
          <span className="badge">Super Admin</span>
          <h1 id="context-title">Escolha como deseja acessar a plataforma.</h1>
          <p className="muted">O contexto escolhido será mantido durante a navegação e pode ser alterado a qualquer momento.</p>
        </div>
        <div className="stack">
          {options.map((option) => (
            <button className="button secondary" key={option.context} type="button" onClick={() => choose(option.context, option.href)}>
              <span>{accessContextLabels[option.context]}</span>
              <small className="muted">{option.description}</small>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

export default function ChooseContext() {
  return <RequireSuperAdmin><ChooseContextContent /></RequireSuperAdmin>;
}
