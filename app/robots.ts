import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://app.julha.com.br';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Authenticated areas and token-bearing auth flows have no SEO value
      // and must not be crawled or cached by search engines.
      disallow: [
        '/admin',
        '/app',
        '/dashboard',
        '/patients',
        '/settings',
        '/patient',
        '/professional',
        '/choose-context',
        '/forbidden',
        '/logout',
        '/change-password',
        '/forgot-password',
        '/reset-password',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
