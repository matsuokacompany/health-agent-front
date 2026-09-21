export function SensitivePlaceholder({ label = 'Informação sensível oculta' }: { label?: string }) {
  return <span className="sensitive-placeholder">🔒 {label}</span>;
}
