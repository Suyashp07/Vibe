import type { Metadata } from 'next';
import EventSlugClient from './EventSlugClient';
import { SAMPLE_TEMPLATE_EVENTS, INITIAL_ORGANIZERS } from '@/lib/store';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.slug.toLowerCase();

  let event: any = null;
  let organizer: any = null;

  // Supabase lookup first for live database sync via direct REST to prevent vendor chunk resolution issues
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project')) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/events?slug=eq.${encodeURIComponent(slug)}&select=*`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        cache: 'no-store',
      });
      if (res.ok) {
        const rows = await res.json();
        if (rows?.[0]) event = rows[0];
      }

      if (!event) {
        const resOrg = await fetch(`${supabaseUrl}/rest/v1/profiles?handle=eq.${encodeURIComponent(slug)}&select=*`, {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
          },
          cache: 'no-store',
        });
        if (resOrg.ok) {
          const orgRows = await resOrg.json();
          if (orgRows?.[0]) organizer = orgRows[0];
        }
      }
    } catch (e) {
      console.warn('Metadata fetch error:', e);
    }
  }

  // Fallback to local seeded store only for demo template previews
  if (!event && !organizer) {
    event = SAMPLE_TEMPLATE_EVENTS.find((e) => e.slug.toLowerCase() === slug);
    if (!event) {
      organizer = INITIAL_ORGANIZERS.find((o) => o.handle.toLowerCase() === slug);
    }
  }

  if (event) {
    const ogImageUrl = `/api/og/${slug}?format=whatsapp`;
    return {
      title: `${event.title} · Vibe by Swaniki`,
      description: `${event.tagline} — ${event.city} · ${event.location_name}`,
      openGraph: {
        title: event.title,
        description: event.tagline,
        url: `/${slug}`,
        siteName: 'Vibe by Swaniki',
        images: [
          {
            url: ogImageUrl,
            width: 1280,
            height: 720,
            alt: event.title,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: event.title,
        description: event.tagline,
        images: [ogImageUrl],
      },
    };
  }

  if (organizer) {
    return {
      title: `${organizer.name} (@${organizer.handle}) · Vibe by Swaniki`,
      description: organizer.bio,
    };
  }

  return {
    title: 'Event · Vibe by Swaniki',
    description: 'India-first bespoke event experiences.',
  };
}

export default function Page({ params }: Props) {
  return <EventSlugClient slug={params.slug} />;
}
