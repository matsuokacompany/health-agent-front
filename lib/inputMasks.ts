export type InputMask = 'cpf' | 'phone' | 'cep' | 'state';

const digits = (value: string, length: number) => value.replace(/\D/g, '').slice(0, length);

export function maskCpf(value: string) {
  return digits(value, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export function maskPhone(value: string) {
  const number = digits(value, 13);
  if (!number) return '';
  const hasCountryCode = number.startsWith('55') && number.length > 11;
  const local = hasCountryCode ? number.slice(2) : number;
  const area = local.slice(0, 2);
  const subscriber = local.slice(2);
  const split = subscriber.length > 8 ? 5 : 4;
  const formatted = [area && `(${area}`, area.length === 2 && ') ', subscriber.slice(0, split), subscriber.length > split && `-${subscriber.slice(split)}`].filter(Boolean).join('');
  return `${hasCountryCode ? '+55 ' : ''}${formatted}`;
}

export function maskCep(value: string) {
  return digits(value, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

export function maskState(value: string) {
  return value.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase();
}

export function applyInputMask(mask: InputMask, value: string) {
  return { cpf: maskCpf, phone: maskPhone, cep: maskCep, state: maskState }[mask](value);
}
