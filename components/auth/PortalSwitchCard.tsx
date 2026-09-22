'use client';

import { UserSwitch } from '@phosphor-icons/react/ssr';
import { useAuth } from './AuthProvider';
import { Button, Card } from '@/components/ui/design';

const TARGETS = {
  patient: { href: '/professional', label: 'Painel do profissional' },
  professional: { href: '/patient/dashboard', label: 'Painel do paciente' },
} as const;

/** Only marcosjunji@gmail.com (a sales demo account provisioned with both
 * roles so he can show either portal) has both isPatient and isProfessional
 * true today, so this renders for nobody else -- no per-user check needed,
 * the role combination itself is the gate. */
export function PortalSwitchCard({ current }: { current: keyof typeof TARGETS }) {
  const { isPatient, isProfessional } = useAuth();
  if (!isPatient || !isProfessional) return null;

  const target = TARGETS[current];
  return <Card className="profile-card profile-card-full" data-tour="profile-portal-switch">
    <h2>Alternar modo de acesso</h2>
    <p className="muted compact">Sua conta tem acesso de paciente e de profissional na plataforma.</p>
    <Button href={target.href}><UserSwitch aria-hidden="true" size={18} weight="bold" /> {target.label}</Button>
  </Card>;
}
