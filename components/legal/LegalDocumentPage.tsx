'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { renderMarkdown } from '@/lib/markdown';
import { getLegalDocument, type LegalDocumentSlug } from '@/services/legal';

export function LegalDocumentPage({ slug, title }: { slug: LegalDocumentSlug; title: string }) {
  const router = useRouter();
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getLegalDocument(slug)
      .then((text) => { if (mounted) setContent(text); })
      .catch((err) => { if (mounted) setError(err instanceof Error ? err.message : 'Não foi possível carregar o documento.'); });
    return () => { mounted = false; };
  }, [slug]);

  return (
    <main className="legal-page">
      <section className="panel legal-doc">
        <button type="button" className="button secondary legal-back" onClick={() => router.back()}>← Voltar</button>
        {error ? <p className="notice danger">{error}</p> : content ? renderMarkdown(content) : <p className="muted" aria-live="polite">Carregando {title.toLowerCase()}...</p>}
      </section>
    </main>
  );
}
