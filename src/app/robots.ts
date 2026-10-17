import { MetadataRoute } from 'next';
import { ADMIN_SECRET_SLUG } from '@/lib/adminConstants';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://vibe.swaniki.com').replace(/\/$/, '');
  const secretAdminPath = `/${ADMIN_SECRET_SLUG}`;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          secretAdminPath,
          `${secretAdminPath}/*`,
          '/api/admin/*',
          '/api/auth/*',
          '/api/telegram/*',
          '/api/whatsapp/*',
          '/dashboard',
          '/dashboard/*',
          '/auth/*',
          '/_not-found',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          secretAdminPath,
          `${secretAdminPath}/*`,
          '/api/*',
          '/dashboard',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
