import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.julha.com.br';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: '/login', priority: 1, changeFrequency: 'monthly' as const },
    { path: '/precos', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/seguranca', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/signup', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/signup-profissional', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/termos-de-uso', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/politica-de-privacidade', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/politica-de-reembolso', priority: 0.3, changeFrequency: 'yearly' as const },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
