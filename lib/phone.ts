function localPhoneDigits(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('55') ? digits.slice(2, 13) : digits.slice(0, 11);
}

export function toBrazilianPhoneDigits(value: string) {
  const local = localPhoneDigits(value);
  return local ? `55${local}` : '';
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
