import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import {
  extractEventFromImage,
  extractEventFromText,
  scrapeUrlMetadata,
  getCategoryCover,
  detectCategoryFromText,
  ExtractedEventData,
} from '@/lib/ai/eventExtractor';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const { url, imageBase64, imageMimeType, text, isPublic, organizerId, organizerName } =
      await req.json();

    if (!url && !imageBase64 && !text) {
      return NextResponse.json(
        { error: 'Please provide an event flyer image, an event URL, or text notes.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    let extracted: ExtractedEventData;
    let coverImageUrl: string | undefined = undefined;

    // CASE 1: Poster Image Provided (AI Vision OCR)
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      const mime = imageMimeType || 'image/jpeg';

      // Attempt upload to Supabase storage if configured
      if (supabase) {
        try {
          const fileExt = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
          const fileName = `web-${Date.now()}-${nanoid(6)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('event-posters')
            .upload(fileName, buffer, { contentType: mime, upsert: true });

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('event-posters')
              .getPublicUrl(fileName);
            coverImageUrl = publicUrlData?.publicUrl;
          }
        } catch (storageErr) {
          console.warn('[AI Create] Storage upload fallback:', storageErr);
        }
      }

      // If storage didn't return URL, use data URL
      if (!coverImageUrl) {
        coverImageUrl = imageBase64.startsWith('data:')
          ? imageBase64
          : `data:${mime};base64,${cleanBase64}`;
      }

      extracted = await extractEventFromImage(buffer, mime, text || url || undefined);

      // If URL was also provided in caption or separate field
      const captionUrlMatch = (text || url || '').match(/(https?:\/\/[^\s]+)/i);
      if (captionUrlMatch) {
        const captionUrl = captionUrlMatch[1].trim();
        try {
          const scraped = await scrapeUrlMetadata(captionUrl);
          if (scraped.price) extracted.price_text = scraped.price;
          if (!extracted.ticket_url) extracted.ticket_url = captionUrl;
          if (scraped.platform && scraped.platform !== 'telegram') {
            extracted.source_platform = scraped.platform;
          }
        } catch (e) {
          console.warn('[AI Create] Scrape caption URL fallback:', e);
        }
      }
    }
    // CASE 2: Text / Event Link Provided
    else {
      const inputContent = url ? (text ? `${url}\n${text}` : url) : text;
      extracted = await extractEventFromText(inputContent);

      const finalCategory =
        extracted.category || detectCategoryFromText(`${extracted.title} ${inputContent}`);
      coverImageUrl =
        extracted.cover_image_url || getCategoryCover(finalCategory, extracted.title);
    }

    // Validate timestamps safely
    let validStartAt = new Date(Date.now() + 86400000).toISOString();
    try {
      if (extracted.start_at && !isNaN(new Date(extracted.start_at).getTime())) {
        validStartAt = new Date(extracted.start_at).toISOString();
      }
    } catch {}

    let validEndAt = new Date(new Date(validStartAt).getTime() + 10800000).toISOString();
    try {
      if (extracted.end_at && !isNaN(new Date(extracted.end_at).getTime())) {
        validEndAt = new Date(extracted.end_at).toISOString();
      }
    } catch {}

    // Unique Slug
    const finalSlug = `${extracted.suggested_slug || 'event'}-${nanoid(4)}`;
    const detectedCity = extracted.city || 'Mumbai';

    // Determine platform & ticketing
    const rawTicketUrl = extracted.ticket_url?.trim() || (url ? url.trim() : undefined);
    const normalizedTicketUrl = rawTicketUrl
      ? rawTicketUrl.startsWith('http://') || rawTicketUrl.startsWith('https://')
        ? rawTicketUrl
        : `https://${rawTicketUrl}`
      : undefined;

    const hasExternalUrl = Boolean(
      normalizedTicketUrl &&
        extracted.source_platform &&
        !['vibe', 'telegram', 'manual'].includes(extracted.source_platform.toLowerCase())
    );

    const finalSourceType: 'native' | 'external' = hasExternalUrl ? 'external' : 'native';
    const finalSourcePlatform = hasExternalUrl ? extracted.source_platform : undefined;
    const finalTicketUrl = hasExternalUrl ? normalizedTicketUrl : undefined;

    const isUUID = Boolean(
      organizerId &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizerId)
    );

    const insertPayload = {
      id: `evt-${Date.now()}`,
      organizer_id: isUUID ? organizerId : undefined,
      organizer_name: organizerName || 'Event Host',
      organizer_handle: 'host',
      slug: finalSlug,
      title: extracted.title || 'Untitled Event',
      tagline: extracted.tagline || `Experience the gathering in ${detectedCity}`,
      description:
        extracted.description ||
        `Join us for ${extracted.title || 'this special gathering'} in ${detectedCity}. An intimate, curated experience bringing together passionate people.`,
      cover_image_url:
        coverImageUrl ||
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      template: extracted.template || 'grove',
      theme: {
        palette: extracted.template === 'ember' ? 'sunset' : 'forest',
        font: 'Inter',
        bg_style: 'solid',
        button_style: 'pill',
      },
      sections: { speakers: false, agenda: false, gallery: false, faq: true },
      event_type: 'in-person',
      location_name: extracted.venue_name || `${detectedCity} Venue`,
      location_address: extracted.location_address || `${extracted.venue_name || detectedCity}, ${detectedCity}, India`,
      city: detectedCity,
      start_at: validStartAt,
      end_at: validEndAt,
      timezone: 'Asia/Kolkata',
      capacity: 0, // 0 denotes unlimited
      is_public: false, // Default to unlisted until superadmin approves
      status: 'draft', // Submitted for superadmin review & approval
      ai_generated: true,
      source_type: finalSourceType,
      source_platform: finalSourcePlatform,
      external_ticket_url: finalTicketUrl,
      external_price_text:
        extracted.price_text || (hasExternalUrl ? 'See booking page' : 'Free Entry'),
      confidence_score: extracted.confidence_score || 0.95,
      faq: extracted.faq && extracted.faq.length > 0 ? extracted.faq : [
        {
          q: 'What is the entry policy?',
          a: isPublic !== false
            ? 'Open registration via Vibe pass.'
            : 'This is an invite-only gathering.',
        },
        {
          q: 'Is advance registration required?',
          a: 'Yes, please RSVP in advance to secure your entry pass.',
        },
      ],
      rsvp_form_config: {
        ask_plus_one: true,
        ask_dietary: false,
        ask_tshirt: false,
        ask_phone: true,
        waitlist_enabled: false,
        approval_required: false,
        confirmation_message: hasExternalUrl
          ? 'Redirecting to booking platform.'
          : 'Your admission pass is confirmed! Present your pass with QR code at the entrance.',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to Supabase if available
    if (supabase) {
      try {
        await supabase.from('events').insert({
          ...insertPayload,
          id: undefined, // Let Supabase auto-generate UUID or use default
        });
      } catch (dbErr) {
        console.warn('[AI Create] Supabase insert warning:', dbErr);
      }
    }

    return NextResponse.json({
      ok: true,
      slug: finalSlug,
      event: insertPayload,
    });
  } catch (error: any) {
    console.error('[AI Create] Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to auto-create event.' },
      { status: 500 }
    );
  }
}
