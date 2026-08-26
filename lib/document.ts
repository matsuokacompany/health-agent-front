function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

/** CPF (11 digits) or CNPJ (14 digits) — never longer, so extra keystrokes are ignored. */
export function toDocumentDigits(value: string) {
  return onlyDigits(value).slice(0, 14);
}

function formatCpf(digits: string) {
  let result = digits.slice(0, 3);
  if (digits.length > 3) result += `.${digits.slice(3, 6)}`;
  if (digits.length > 6) result += `.${digits.slice(6, 9)}`;
  if (digits.length > 9) result += `-${digits.slice(9, 11)}`;
  return result;
}

function formatCnpj(digits: string) {
  let result = digits.slice(0, 2);
  if (digits.length > 2) result += `.${digits.slice(2, 5)}`;
  if (digits.length > 5) result += `.${digits.slice(5, 8)}`;
  if (digits.length > 8) result += `/${digits.slice(8, 12)}`;
  if (digits.length > 12) result += `-${digits.slice(12, 14)}`;
  return result;
}

/**
 * Formats as a CPF while 11 or fewer digits have been typed, and switches to
 * the CNPJ mask automatically once a 12th digit appears — one input field
 * that adapts to whichever document the professional is entering.
 */
export function formatCpfCnpj(value: string) {
  const digits = toDocumentDigits(value);
  return digits.length > 11 ? formatCnpj(digits) : formatCpf(digits);
}

export function documentKind(value: string): 'cpf' | 'cnpj' | null {
  const digits = toDocumentDigits(value);
  if (digits.length === 11) return 'cpf';
  if (digits.length === 14) return 'cnpj';
  return null;
}
