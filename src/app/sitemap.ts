import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { SAMPLE_TEMPLATE_EVENTS } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://vibe.swaniki.com').replace(/\/$/, '');
  const now = new Date();

  // 1. Static Core Landing Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/vibes`,
      lastModified: now,
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/create`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/passes`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  // 2. Fetch all public, live events from Supabase
  let eventRoutes: MetadataRoute.Sitemap = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });

      const { data: events, error } = await supabase
        .from('events')
        .select('slug, updated_at, created_at, start_at')
        .eq('is_public', true)
        .eq('status', 'live')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (!error && events && events.length > 0) {
        eventRoutes = events.map((ev) => {
          const modDate = ev.updated_at || ev.created_at || now.toISOString();
          return {
            url: `${baseUrl}/${ev.slug}`,
            lastModified: new Date(modDate),
            changeFrequency: 'daily',
            priority: 0.8,
          };
        });
      }
    } catch (err) {
      console.warn('[sitemap] Failed to fetch events from Supabase:', err);
    }
  }

  // 3. Fallback to sample template events if DB query returned 0 rows
  if (eventRoutes.length === 0) {
    eventRoutes = SAMPLE_TEMPLATE_EVENTS.map((ev) => ({
      url: `${baseUrl}/${ev.slug}`,
      lastModified: new Date(ev.updated_at || ev.created_at || now.toISOString()),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  }

  return [...staticRoutes, ...eventRoutes];
}
