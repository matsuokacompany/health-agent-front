export const INPUT_LIMITS = {
  name: 255, phone: 32, city: 255, state: 255, gender: 255, cpf: 32,
  professionalRegistry: 64, registryState: 32, specialty: 128, biography: 2_000,
  planTitle: 255, planDescription: 2_000, planProfessionalRole: 64,
  anamnesis: 20_000, symptomDescription: 280, suspectedCause: 280, genericAiText: 6_000,
} as const;

// Markup remains untouched and is rendered by React as text. NUL is removed;
// other non-printable controls are rejected rather than silently changing PHI.
export function normalizeUserText(value: string) { return value.replace(/\0/g, ''); }
export function hasNonPrintableControls(value: string) { return /[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u.test(value); }
export function validateUserText(value: string, maxLength: number): string | null {
  if (hasNonPrintableControls(value)) return 'Remova caracteres de controle não imprimíveis.';
  if (normalizeUserText(value).length > maxLength) return `Use no máximo ${maxLength.toLocaleString('pt-BR')} caracteres.`;
  return null;
}
