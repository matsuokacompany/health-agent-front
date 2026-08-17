/** Accepts only local assets or same-origin HTTP(S) URLs. */
export function safeImageUrl(value: unknown, origin?: string): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  if (value.startsWith('data:image/') || value.startsWith('blob:')) return value;
  if (!origin) return null;
  try {
    const url = new URL(value, origin);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.origin === origin ? url.href : null;
  } catch { return null; }
}
