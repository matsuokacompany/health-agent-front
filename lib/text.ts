export function truncate(text?: string | null, max = 70) {
  if (!text) return null;
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}
