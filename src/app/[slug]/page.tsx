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

  if (event) {
    const ogImageUrl = `/api/og/${slug}?format=whatsapp`;
    return {
      title: `${event.title} · Vibe by Swaniki`,
      description: `${event.tagline || event.description} — ${event.city} · ${event.location_name}`,
      openGraph: {
        title: event.title,
        description: event.tagline || event.description,
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
        description: event.tagline || event.description,
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

export default async function Page({ params }: Props) {
  const { event, organizer } = await getSlugEntity(params.slug);
  return <EventSlugClient slug={params.slug} initialEvent={event} initialOrganizer={organizer} />;
}
