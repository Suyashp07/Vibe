import type { Metadata } from 'next';
import EventSlugClient from './EventSlugClient';
import { SAMPLE_TEMPLATE_EVENTS, INITIAL_ORGANIZERS } from '@/lib/store';
import { EventItem, Profile } from '@/types';
import { createClient } from '@supabase/supabase-js';

interface Props {
  params: { slug: string };
}

async function getSlugEntity(rawSlug: string): Promise<{ event: EventItem | null; organizer: Profile | null }> {
  const slug = (rawSlug || '').trim().toLowerCase();
  if (!slug) return { event: null, organizer: null };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false },
      });

      // 1. Check events table directly
      const { data: dbEvent } = await supabase
        .from('events')
        .select('*, profiles:organizer_id(id, name, handle, logo_url, brand_color, email)')
        .ilike('slug', slug)
        .maybeSingle();

      if (dbEvent) {
        const orgProfile = dbEvent.profiles || {};
        const formattedEvent: EventItem = {
          id: dbEvent.id,
          organizer_id: dbEvent.organizer_id || orgProfile.id || 'org-1',
          organizer_name: orgProfile.name || dbEvent.organizer_name || 'Organizer',
          organizer_handle: orgProfile.handle || dbEvent.organizer_handle || 'organizer',
          organizer_logo: orgProfile.logo_url || dbEvent.organizer_logo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          organizer_brand_color: orgProfile.brand_color || dbEvent.organizer_brand_color || '#E8621A',
          slug: dbEvent.slug,
          title: dbEvent.title,
          tagline: dbEvent.tagline || '',
          description: dbEvent.description || '',
          cover_image_url: dbEvent.cover_image_url,
          template: dbEvent.template || 'grove',
          theme: dbEvent.theme || { palette: 'forest', font: 'Inter + Fraunces', bg_style: 'texture', button_style: 'solid' },
          sections: dbEvent.sections || { speakers: true, agenda: true, gallery: true, faq: true },
          event_type: dbEvent.event_type || 'in-person',
          location_name: dbEvent.location_name,
          location_address: dbEvent.location_address,
          city: dbEvent.city || 'Mumbai',
          start_at: dbEvent.start_at,
          end_at: dbEvent.end_at,
          timezone: dbEvent.timezone || 'Asia/Kolkata',
          capacity: dbEvent.capacity || 50,
          is_public: dbEvent.is_public ?? true,
          status: dbEvent.status || 'live',
          ai_generated: dbEvent.ai_generated || false,
          faq: dbEvent.faq || [],
          speakers: dbEvent.speakers || [],
          agenda: dbEvent.agenda || [],
          gallery: dbEvent.gallery || [],
          rsvp_form_config: dbEvent.rsvp_form_config || { ask_plus_one: true, ask_dietary: true, waitlist_enabled: true },
          whatsapp_caption: dbEvent.whatsapp_caption,
          instagram_caption: dbEvent.instagram_caption,
          source_type: dbEvent.source_type || 'native',
          source_platform: dbEvent.source_platform || undefined,
          external_ticket_url: dbEvent.external_ticket_url || undefined,
          external_price_text: dbEvent.external_price_text || undefined,
          confidence_score: dbEvent.confidence_score || undefined,
          is_flash: Boolean(
            dbEvent.is_flash ||
            dbEvent.theme?.is_flash ||
            dbEvent.source_type === 'bot' ||
            dbEvent.source_platform === 'whatsapp' ||
            dbEvent.created_via === 'bot' ||
            dbEvent.theme?.created_via === 'bot'
          ),
          flash_activity: dbEvent.flash_activity || dbEvent.theme?.flash_activity,
          spots_limit: dbEvent.spots_limit || dbEvent.theme?.spots_limit,
          spots_filled: dbEvent.spots_filled || dbEvent.theme?.spots_filled || 0,
          whatsapp_host_phone: dbEvent.whatsapp_host_phone || dbEvent.theme?.whatsapp_host_phone || orgProfile.phone || '',
          vibe_cheers_count: dbEvent.vibe_cheers_count || dbEvent.theme?.vibe_cheers_count || 0,
          flash_tags: dbEvent.flash_tags || dbEvent.theme?.flash_tags || [],
          created_at: dbEvent.created_at,
          updated_at: dbEvent.updated_at,
        };
        return { event: formattedEvent, organizer: null };
      }

      // 2. Check profiles
      const { data: dbOrg } = await supabase
        .from('profiles')
        .select('*')
        .ilike('handle', slug)
        .maybeSingle();

      if (dbOrg) {
        return { event: null, organizer: dbOrg };
      }
    } catch (e) {
      console.warn('SSR getSlugEntity error:', e);
    }
  }

  // Fallback to local template events / organizers
  const localEvent = SAMPLE_TEMPLATE_EVENTS.find((e) => e.slug.toLowerCase() === slug);
  if (localEvent) return { event: localEvent, organizer: null };

  const localOrg = INITIAL_ORGANIZERS.find((o) => o.handle.toLowerCase() === slug);
  if (localOrg) return { event: null, organizer: localOrg };

  return { event: null, organizer: null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (params.slug || '').toLowerCase();
  const { event, organizer } = await getSlugEntity(slug);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://vibe.swaniki.com').replace(/\/$/, '');
  const canonicalUrl = `${baseUrl}/${slug}`;

  if (event) {
    const ogImageUrl = `${baseUrl}/api/og/${slug}?title=${encodeURIComponent(event.title)}&city=${encodeURIComponent(event.city || 'India')}`;
    const desc = event.tagline || event.description || `Join ${event.title} in ${event.city} on Vibe.`;
    return {
      title: `${event.title} — ${event.city} · Vibe by Swaniki`,
      description: `${desc} — ${event.city} · ${event.location_name}`,
      openGraph: {
        title: event.title,
        description: desc,
        url: canonicalUrl,
        siteName: 'Vibe by Swaniki',
        locale: 'en_IN',
        type: 'website',
        images: [
          {
            url: event.cover_image_url || ogImageUrl,
            width: 1200,
            height: 630,
            alt: event.title,
          },
        ],
      },
      keywords: [
        event.title,
        `events in ${event.city}`,
        `${event.city} events`,
        event.location_name || '',
        'vibe events',
        'book tickets',
        'rsvp pass',
        'things to do in ' + event.city,
      ].filter(Boolean),
      alternates: {
        canonical: canonicalUrl,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
        },
      },
      twitter: {
        card: 'summary_large_image',
        title: `${event.title} — ${event.city}`,
        description: desc,
        images: [event.cover_image_url || ogImageUrl],
        creator: '@Swaniki',
      },
    };
  }

  if (organizer) {
    return {
      title: `${organizer.name} (@${organizer.handle}) · Vibe by Swaniki`,
      description: organizer.bio || `Explore events curated by ${organizer.name} on Vibe.`,
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }

  return {
    title: 'Event · Vibe by Swaniki',
    description: 'India-first bespoke event experiences.',
  };
}

export default async function Page({ params }: Props) {
  const { event, organizer } = await getSlugEntity(params.slug);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://vibe.swaniki.com').replace(/\/$/, '');
  const canonicalUrl = `${baseUrl}/${params.slug}`;

  // Build Google Event Rich Results Schema (JSON-LD)
  let eventSchemaJson: any = null;
  let breadcrumbJson: any = null;

  if (event) {
    const rawPrice = event.external_price_text || (event as any).price_text || '';
    const numericPrice = rawPrice.replace(/[^0-9]/g, '') || '0';
    const isFree = rawPrice.toLowerCase().includes('free') || numericPrice === '0';

    eventSchemaJson = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: event.title,
      description: event.tagline || event.description,
      startDate: event.start_at || new Date().toISOString(),
      endDate: event.end_at || new Date(Date.now() + 10800000).toISOString(),
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      location: {
        '@type': 'Place',
        name: event.location_name || `${event.city} Venue`,
        address: {
          '@type': 'PostalAddress',
          streetAddress: event.location_address || event.location_name || '',
          addressLocality: event.city || 'Pune',
          addressRegion: 'MH',
          addressCountry: 'IN',
        },
      },
      image: [
        event.cover_image_url || `${baseUrl}/api/og/${event.slug}`,
      ],
      organizer: {
        '@type': 'Organization',
        name: event.organizer_name || 'Vibe by Swaniki',
        url: baseUrl,
      },
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        price: isFree ? '0' : numericPrice,
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        validFrom: event.created_at || new Date().toISOString(),
      },
    };

    breadcrumbJson = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: `Events in ${event.city || 'India'}`,
          item: `${baseUrl}/?city=${encodeURIComponent(event.city || 'India')}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: event.title,
          item: canonicalUrl,
        },
      ],
    };
  }

  return (
    <>
      {eventSchemaJson && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchemaJson) }}
        />
      )}
      {breadcrumbJson && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }}
        />
      )}
      <EventSlugClient slug={params.slug} initialEvent={event} initialOrganizer={organizer} />
    </>
  );
}
