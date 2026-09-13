import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyStaffSession } from '@/lib/adminAuth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyStaffSession(req);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const supabase = getAdminClient();
    const { data: events, error } = await supabase
      .from('events')
      .select('*, profiles:organizer_id(id, name, handle, logo_url, email)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normalize event objects for frontend consumption
    const allEvents = (events || []).map((e) => {
      const isExternal =
        e.source_type === 'external' ||
        Boolean(e.external_ticket_url) ||
        Boolean(e.is_external);

      const coverImage = e.cover_image_url || e.cover_image || '';
      const venueName = e.location_name || e.venue_name || '';
      const venueAddress = e.location_address || e.venue_address || '';

      // Format date / time display
      let dateDisplay = e.date || 'TBA';
      let timeDisplay = e.time || '';
      if (e.start_at) {
        try {
          const d = new Date(e.start_at);
          dateDisplay = d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          timeDisplay = d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          });
        } catch {
          // ignore
        }
      }

      // Price computation
      let priceInr = e.price_inr;
      if (priceInr === undefined && e.external_price_text) {
        const parsed = parseInt(e.external_price_text.replace(/\D/g, ''), 10);
        priceInr = isNaN(parsed) ? 0 : parsed;
      }

      return {
        ...e,
        cover_image: coverImage,
        venue_name: venueName,
        venue_address: venueAddress,
        date: dateDisplay,
        time: timeDisplay,
        is_external: isExternal,
        platform: e.source_platform || (isExternal ? 'external' : 'vibe'),
        ticket_link: e.external_ticket_url || e.ticket_link || '',
        price_inr: priceInr || 0,
        price_text: e.external_price_text || (priceInr ? `₹${priceInr}` : 'Free Entry'),
      };
    });

    const drafts = allEvents.filter((e) => e.status === 'draft');
    const published = allEvents.filter((e) => e.status === 'live' || e.status === 'published');
    const external = allEvents.filter((e) => e.is_external);

    return NextResponse.json({
      events: allEvents,
      metrics: {
        total: allEvents.length,
        draftsCount: drafts.length,
        publishedCount: published.length,
        externalCount: external.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyStaffSession(req);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing event id or updates payload' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Fetch existing state for audit log comparison
    const { data: existing } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    const sanitizedUpdates: Record<string, any> = {};

    // 1. Status normalization ('published' -> 'live' to conform to PostgreSQL CHECK constraint)
    if (updates.status !== undefined) {
      if (updates.status === 'published' || updates.status === 'live') {
        sanitizedUpdates.status = 'live';
      } else if (updates.status === 'draft') {
        sanitizedUpdates.status = 'draft';
      } else if (updates.status === 'past') {
        sanitizedUpdates.status = 'past';
      } else if (updates.status === 'cancelled') {
        sanitizedUpdates.status = 'cancelled';
      }
    }

    // 2. Direct core fields
    if (updates.title !== undefined) sanitizedUpdates.title = updates.title;
    if (updates.tagline !== undefined) sanitizedUpdates.tagline = updates.tagline;
    if (updates.description !== undefined) sanitizedUpdates.description = updates.description;
    if (updates.city !== undefined) sanitizedUpdates.city = updates.city;
    if (updates.capacity !== undefined) sanitizedUpdates.capacity = updates.capacity;
    if (updates.is_public !== undefined) sanitizedUpdates.is_public = updates.is_public;

    // 3. Location fields mapping
    if (updates.location_name !== undefined || updates.venue_name !== undefined) {
      sanitizedUpdates.location_name = updates.location_name || updates.venue_name;
    }
    if (updates.location_address !== undefined || updates.venue_address !== undefined) {
      sanitizedUpdates.location_address = updates.location_address || updates.venue_address;
    }

    // 4. Image mapping
    if (updates.cover_image_url !== undefined || updates.cover_image !== undefined) {
      sanitizedUpdates.cover_image_url = updates.cover_image_url || updates.cover_image;
    }

    // 5. External & platform mapping
    if (updates.source_type !== undefined) {
      sanitizedUpdates.source_type = updates.source_type;
    } else if (updates.is_external !== undefined) {
      sanitizedUpdates.source_type = updates.is_external ? 'external' : 'native';
    }

    if (updates.source_platform !== undefined || updates.platform !== undefined) {
      sanitizedUpdates.source_platform = updates.source_platform || updates.platform;
    }

    if (
      updates.external_ticket_url !== undefined ||
      updates.ticket_link !== undefined ||
      updates.external_url !== undefined
    ) {
      sanitizedUpdates.external_ticket_url =
        updates.external_ticket_url || updates.ticket_link || updates.external_url;
    }

    // 6. Pricing text mapping
    if (updates.external_price_text !== undefined) {
      sanitizedUpdates.external_price_text = updates.external_price_text;
    } else if (updates.price_inr !== undefined || updates.price !== undefined) {
      const num = Number(updates.price_inr ?? updates.price);
      sanitizedUpdates.external_price_text = num > 0 ? `₹${num}` : 'Free Entry';
    }

    // 7. Date / Time mapping
    if (updates.start_at !== undefined) {
      sanitizedUpdates.start_at = updates.start_at;
    } else if (updates.date) {
      try {
        const timeStr = updates.time || '18:00';
        const combined = new Date(`${updates.date} ${timeStr}`);
        if (!isNaN(combined.getTime())) {
          sanitizedUpdates.start_at = combined.toISOString();
        }
      } catch {
        // ignore
      }
    }

    if (updates.end_at !== undefined) {
      sanitizedUpdates.end_at = updates.end_at;
    } else if (updates.end_date) {
      try {
        const timeStr = updates.end_time || '21:00';
        const combined = new Date(`${updates.end_date} ${timeStr}`);
        if (!isNaN(combined.getTime())) {
          sanitizedUpdates.end_at = combined.toISOString();
        }
      } catch {
        // ignore
      }
    }

    // 8. Template & layout metadata
    if (updates.template !== undefined) sanitizedUpdates.template = updates.template;
    if (updates.theme !== undefined) sanitizedUpdates.theme = updates.theme;
    if (updates.sections !== undefined) sanitizedUpdates.sections = updates.sections;
    if (updates.faq !== undefined) sanitizedUpdates.faq = updates.faq;
    if (updates.rsvp_form_config !== undefined) sanitizedUpdates.rsvp_form_config = updates.rsvp_form_config;

    sanitizedUpdates.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('events')
      .update(sanitizedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Determine audit action name
    let actionName = 'EVENT_UPDATE';
    if (sanitizedUpdates.status === 'live' && existing?.status === 'draft') {
      actionName = 'EVENT_PUBLISH';
    } else if (sanitizedUpdates.status === 'draft' && existing?.status === 'live') {
      actionName = 'EVENT_UNPUBLISH';
    }

    await logAuditEvent({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.role,
      action: actionName,
      targetType: 'event',
      targetId: id,
      metadata: {
        before: { status: existing?.status, title: existing?.title },
        after: sanitizedUpdates,
      },
    });

    return NextResponse.json({ success: true, event: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyStaffSession(req);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing event id parameter' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Fetch event title for audit trail
    const { data: existing } = await supabase
      .from('events')
      .select('title, slug')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('events').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logAuditEvent({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.role,
      action: 'EVENT_DELETE',
      targetType: 'event',
      targetId: id,
      metadata: {
        title: existing?.title || 'Unknown',
        slug: existing?.slug || 'Unknown',
      },
    });

    return NextResponse.json({ success: true, message: 'Event permanently deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
