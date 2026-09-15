import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffSession } from '@/lib/adminAuth';
import { logAuditEvent } from '@/lib/audit';
import { getSupabaseAdmin } from '@/lib/adminSupabase';
import { fetchListingPage, detectPlatform } from '@/lib/aggregation/crawler';
import { areDuplicates } from '@/lib/aggregation/dedup';
import { extractEventFromText } from '@/lib/ai/eventExtractor';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyStaffSession(req);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    const platform = detectPlatform(url);
    const supabase = getSupabaseAdmin();

    // 1. Fetch raw page text using Jina Reader proxy fallback
    const rawContent = await fetchListingPage(url);

    // 2. Extract structured fields with Gemini AI
    const extracted = await extractEventFromText(
      `Source URL: ${url}\nPlatform: ${platform}\n\nPage Content:\n${rawContent.slice(0, 12000)}`
    );

    const title = extracted.title || 'Extracted Event';
    const city = extracted.city || 'Mumbai';
    const venue = extracted.venue_name || `${city} Venue`;
    const date = extracted.start_at ? new Date(extracted.start_at).toISOString().split('T')[0] : null;

    // 3. Duplicate check against existing events
    let isDuplicate = false;
    let duplicateMatchName: string | null = null;

    if (supabase) {
      const { data: existingEvents } = await supabase
        .from('events')
        .select('id, title, start_at, location_name, city')
        .order('created_at', { ascending: false })
        .limit(100);

      if (existingEvents) {
        for (const existing of existingEvents) {
          const existingDate = existing.start_at ? new Date(existing.start_at).toISOString().split('T')[0] : null;
          const match = areDuplicates(
            { name: title, date, venue },
            { name: existing.title, date: existingDate, venue: existing.location_name || existing.city }
          );

          if (match) {
            isDuplicate = true;
            duplicateMatchName = existing.title;
            break;
          }
        }
      }
    }

    // 4. Save to database as draft / review
    const slugBase = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 45);
    const uniqueSlug = `${slugBase}-${Math.random().toString(36).substring(2, 6)}`;

    const validStartAt = extracted.start_at && !isNaN(new Date(extracted.start_at).getTime())
      ? new Date(extracted.start_at).toISOString()
      : new Date(Date.now() + 86400000).toISOString();

    const insertPayload = {
      slug: uniqueSlug,
      title,
      tagline: extracted.tagline || `Live on ${platform}`,
      description: extracted.description || `Event curated from ${platform}. Direct registration available.`,
      cover_image_url: extracted.cover_image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      template: 'grove',
      theme: { palette: 'forest', font: 'Inter', bg_style: 'solid', button_style: 'solid' },
      sections: { speakers: false, agenda: false, gallery: false, faq: false },
      event_type: 'in-person',
      location_name: venue,
      location_address: `${venue}, ${city}, India`,
      city: city,
      start_at: validStartAt,
      end_at: extracted.end_at && !isNaN(new Date(extracted.end_at).getTime()) ? new Date(extracted.end_at).toISOString() : null,
      timezone: 'Asia/Kolkata',
      is_public: false,
      status: 'draft',
      ai_generated: true,
      source_type: 'external',
      source_platform: platform,
      external_ticket_url: url,
      external_price_text: extracted.price_text || 'See official site',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let savedEvent: any = insertPayload;
    if (supabase) {
      const { data, error: insertErr } = await supabase
        .from('events')
        .insert(insertPayload)
        .select('*')
        .single();

      if (!insertErr && data) {
        savedEvent = data;
      }
    }

    // 5. Audit log
    await logAuditEvent({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.role,
      action: 'EVENT_INGEST_URL',
      targetType: 'event',
      targetId: savedEvent.id || uniqueSlug,
      metadata: {
        url,
        platform,
        title,
        isDuplicate,
        duplicateMatchName,
      },
    });

    return NextResponse.json({
      ok: true,
      event: savedEvent,
      isDuplicate,
      duplicateWarning: isDuplicate ? `Potential duplicate of "${duplicateMatchName}"` : null,
    });
  } catch (err: any) {
    console.error('API /admin/events/from-url error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to extract and ingest event from URL' },
      { status: 500 }
    );
  }
}
