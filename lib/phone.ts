function localPhoneDigits(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('55') ? digits.slice(2, 13) : digits.slice(0, 11);
}

export function toBrazilianPhoneDigits(value: string) {
  const local = localPhoneDigits(value);
  return local ? `55${local}` : '';
}

// Same list of valid ANATEL area codes as the backend's phone_validation.py
// — keep in sync if that list ever changes.
const VALID_DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

export function isValidBrazilianMobile(value: string) {
  const local = localPhoneDigits(value);
  if (local.length !== 11) return false;
  const ddd = Number(local.slice(0, 2));
  if (!VALID_DDDS.has(ddd)) return false;
  return local[2] === '9';
}

/**
 * Client-side mirror of the backend's phone validation — WhatsApp check-in
 * delivery depends on this being a real, well-formed number, so this shows
 * an inline error before ever submitting instead of round-tripping a bad
 * number to the server. Returns null while still incomplete (fewer than 11
 * local digits) so it doesn't nag before the user finishes typing.
 */
export function phoneValidationError(value: string): string | null {
  const local = localPhoneDigits(value);
  if (local.length === 0 || local.length < 11) return null;
  return isValidBrazilianMobile(value) ? null : 'Telefone inválido. Confira o DDD e o número.';
}

export function formatBrazilianPhone(value: string) {
  const local = localPhoneDigits(value);
  if (!local) return '+55';

  const areaCode = local.slice(0, 2);
  const number = local.slice(2);
  if (local.length <= 2) return `+55 (${areaCode}`;
  if (number.length <= 4) return `+55 (${areaCode}) ${number}`;

  const firstPartLength = number.length > 8 ? 5 : 4;
  return `+55 (${areaCode}) ${number.slice(0, firstPartLength)}-${number.slice(firstPartLength)}`;
}
