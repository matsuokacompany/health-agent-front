export type LegalDocumentSlug = 'termos-de-uso' | 'politica-de-privacidade' | 'politica-de-reembolso';

function resolveBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL
    ?? process.env.NEXT_PUBLIC_API_BASE_URL
    ?? '';
}

// This one endpoint returns markdown text, not JSON, so it can't go through
// the shared api() client (which always parses the body as JSON) -- and it
// needs no auth/CSRF, it's served publicly.
export async function getLegalDocument(slug: LegalDocumentSlug): Promise<string> {
  const baseUrl = resolveBaseUrl().replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/api/legal/${slug}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Não foi possível carregar o documento (${response.status}).`);
  return response.text();
}
