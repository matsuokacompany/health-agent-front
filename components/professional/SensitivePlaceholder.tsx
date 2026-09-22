import { Lock } from '@phosphor-icons/react/ssr';

export function SensitivePlaceholder({ label = 'Informação sensível oculta' }: { label?: string }) {
  return <span className="sensitive-placeholder"><Lock aria-hidden="true" weight="duotone" /> {label}</span>;
}
