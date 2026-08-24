export function formatBrazilianPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  const includesCountryCode = value.trim().startsWith('+') || (digits.startsWith('55') && digits.length > 11);
  const local = includesCountryCode ? digits.slice(2, 13) : digits.slice(0, 11);
  if (!local) return includesCountryCode ? '+55' : '';

  const areaCode = local.slice(0, 2);
  const number = local.slice(2);
  const prefix = includesCountryCode ? '+55 ' : '';
  if (local.length <= 2) return `${prefix}(${areaCode}`;
  if (number.length <= 4) return `${prefix}(${areaCode}) ${number}`;

  const firstPartLength = number.length > 8 ? 5 : 4;
  return `${prefix}(${areaCode}) ${number.slice(0, firstPartLength)}-${number.slice(firstPartLength)}`;
}
