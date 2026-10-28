import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendRsvpConfirmedEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key, { auth: { persistSession: false } });
}

function getAppUrl(req?: Request): string {
  if (req) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      const proto = req.headers.get('x-forwarded-proto') || 'https';
      return `${proto}://${host}`;
    }
  }
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/$/, '');
  }
  return 'https://vibe.swaniki.com';
}

/**
 * Helper to resolve event by token (theme->>manage_token or fallback id/slug)
 */
async function resolveEventByToken(supabase: ReturnType<typeof getSupabaseAdmin>, token: string) {
  if (!token) return null;

  // 0. Support preview mode for design inspection & demos
  if (token === 'preview' || token === 'demo') {
    return {
      id: 'demo-chess-match',
      slug: 'chess-match',
      title: 'Chess Match',
      tagline: 'Join an exciting chess match at Amity University.',
      description: 'Join an exciting chess match at Amity University.',
      location_name: 'Amity University',
      city: 'Delhi NCR',
      start_at: '2026-11-25T13:30:00+05:30',
      status: 'open',
      external_price_text: 'Free entry',
      source_platform: 'whatsapp',
      theme: {
        manage_token: 'preview',
        require_approval: false,
        registrations_closed: false,
      },
      rsvp_form_config: {
        require_approval: false,
      },
    };
  }

  // 1. Look up by manage_token inside theme JSONB
  const { data: byToken, error: tokenErr } = await supabase
    .from('events')
    .select('*')
    .filter('theme->>manage_token', 'eq', token)
    .maybeSingle();

  if (byToken) return byToken;

  // 2. Fallback lookup by id or slug if valid token wasn't found in theme
  const { data: byId } = await supabase
    .from('events')
    .select('*')
    .or(`id.eq.${token},slug.eq.${token}`)
    .maybeSingle();

  return byId || null;
}

/**
 * GET /api/manage/[token]
 * Fetches event metadata, live RSVPs, and current stats for the host management sheet
 */
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params.token;
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const event = await resolveEventByToken(supabase, token);

    if (!event) {
      return NextResponse.json({ error: 'Event not found or invalid host token' }, { status: 404 });
    }

    if (token === 'preview' || token === 'demo') {
      return NextResponse.json({
        ok: true,
        event,
        rsvps: [],
        stats: {
          total: 0,
          confirmed: 0,
          waitlisted: 0,
          cancelled: 0,
          checkedIn: 0,
          capacity: null,
          requireApproval: false,
          registrationsClosed: false,
        },
      });
    }

    // Fetch all RSVPs for this event
    const { data: rsvps, error: rsvpsError } = await supabase
      .from('rsvps')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false });

    if (rsvpsError) {
      console.error('[Manage API] Error fetching RSVPs:', rsvpsError);
      return NextResponse.json({ error: 'Failed to load guest RSVPs' }, { status: 500 });
    }

    const allRsvps = rsvps || [];
    const confirmedCount = allRsvps.filter((r) => r.status === 'confirmed').length;
    const waitlistedCount = allRsvps.filter((r) => r.status === 'waitlisted').length;
    const cancelledCount = allRsvps.filter((r) => r.status === 'cancelled').length;
    const checkedInCount = allRsvps.filter((r) => r.custom_responses?.attended === true).length;
    const capacity = event.capacity || event.theme?.spots_limit || null;
    const requireApproval = Boolean(
      event.theme?.require_approval ?? event.rsvp_form_config?.require_approval ?? false
    );
    const registrationsClosed = Boolean(
      event.status === 'closed' || event.theme?.registrations_closed
    );

    return NextResponse.json({
      ok: true,
      event,
      rsvps: allRsvps,
      stats: {
        total: allRsvps.length,
        confirmed: confirmedCount,
        waitlisted: waitlistedCount,
        cancelled: cancelledCount,
        checkedIn: checkedInCount,
        capacity,
        requireApproval,
        registrationsClosed,
      },
    });
  } catch (err: any) {
    console.error('[Manage API] Unexpected error in GET:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

/**
 * POST /api/manage/[token]
 * Executes host actions:
 *  - update_rsvp_status: approve / waitlist / decline guest
 *  - batch_approve_waitlist: admit all pending guests
 *  - toggle_approval_mode: switch between instant RSVP and curated review
 *  - toggle_registrations: open / close RSVPs
 *  - update_capacity: adjust capacity limit
 *  - check_in_guest: mark attendance at door
 */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params.token;
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const event = await resolveEventByToken(supabase, token);

    if (!event) {
      return NextResponse.json({ error: 'Unauthorized or invalid token' }, { status: 403 });
    }

    if (token === 'preview' || token === 'demo') {
      return NextResponse.json({
        ok: true,
        preview: true,
        message: 'Preview action simulated successfully',
      });
    }

    const body = await req.json();
    const { action } = body;
    const appUrl = getAppUrl(req);

    // 1. UPDATE SINGLE RSVP STATUS (Approve In / Move Out / Waitlist)
    if (action === 'update_rsvp_status') {
      const { rsvpId, status } = body;
      if (!rsvpId || !['confirmed', 'waitlisted', 'cancelled'].includes(status)) {
        return NextResponse.json(
          { error: 'Valid rsvpId and status (confirmed, waitlisted, cancelled) are required' },
          { status: 400 }
        );
      }

      const { data: updatedRsvp, error: updateErr } = await supabase
        .from('rsvps')
        .update({ status })
        .eq('id', rsvpId)
        .eq('event_id', event.id)
        .select()
        .single();

      if (updateErr || !updatedRsvp) {
        console.error('[Manage API] Failed to update RSVP:', updateErr);
        return NextResponse.json({ error: 'Failed to update RSVP status' }, { status: 500 });
      }

      // If approved into confirmed status, dispatch confirmation email with digital pass
      if (status === 'confirmed') {
        try {
          await sendRsvpConfirmedEmail({
            to: updatedRsvp.email,
            guestName: updatedRsvp.name || 'Valued Guest',
            rsvp: updatedRsvp,
            event,
            organizer: {
              name: (!event.organizer_name || /^(organizer|event host|host|admin)$/i.test(event.organizer_name)) ? 'Vibe by Swaniki' : event.organizer_name,
              brand_color: event.theme?.palette || '#FF5500',
              logo_url: event.cover_image_url,
              handle: event.slug,
            },
            appUrl,
          });
        } catch (emailErr: any) {
          console.warn('[Manage API] Email pass notification warning:', emailErr?.message);
        }
      }

      return NextResponse.json({ ok: true, rsvp: updatedRsvp });
    }

    // 2. BATCH APPROVE ALL WAITLISTED GUESTS
    if (action === 'batch_approve_waitlist') {
      const { data: waitlistedGuests, error: fetchErr } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', event.id)
        .eq('status', 'waitlisted');

      if (fetchErr) {
        return NextResponse.json({ error: 'Failed to fetch waitlisted guests' }, { status: 500 });
      }

      const count = waitlistedGuests?.length || 0;
      if (count > 0) {
        const ids = waitlistedGuests.map((g) => g.id);
        const { error: batchErr } = await supabase
          .from('rsvps')
          .update({ status: 'confirmed' })
          .in('id', ids);

        if (batchErr) {
          console.error('[Manage API] Batch approval error:', batchErr);
          return NextResponse.json({ error: 'Failed to approve guests' }, { status: 500 });
        }

        // Fire confirmation emails in background
        waitlistedGuests.forEach((guest) => {
          sendRsvpConfirmedEmail({
            to: guest.email,
            guestName: guest.name || 'Valued Guest',
            rsvp: { ...guest, status: 'confirmed' },
            event,
            organizer: {
              name: (!event.organizer_name || /^(organizer|event host|host|admin)$/i.test(event.organizer_name)) ? 'Vibe by Swaniki' : event.organizer_name,
              brand_color: event.theme?.palette || '#FF5500',
              logo_url: event.cover_image_url,
              handle: event.slug,
            },
            appUrl,
          }).catch((err) => console.warn('[Manage API] Batch email warning:', err?.message));
        });
      }

      return NextResponse.json({ ok: true, approvedCount: count });
    }

    // 3. TOGGLE APPROVAL MODE (Curated Review vs Instant Auto-Approve)
    if (action === 'toggle_approval_mode') {
      const { requireApproval } = body;
      const updatedTheme = {
        ...(event.theme || {}),
        require_approval: Boolean(requireApproval),
      };
      const updatedRsvpConfig = {
        ...(event.rsvp_form_config || {}),
        require_approval: Boolean(requireApproval),
      };

      const { error: themeErr } = await supabase
        .from('events')
        .update({
          theme: updatedTheme,
          rsvp_form_config: updatedRsvpConfig,
          updated_at: new Date().toISOString(),
        })
        .eq('id', event.id);

      if (themeErr) {
        console.error('[Manage API] Error updating approval mode:', themeErr);
        return NextResponse.json({ error: 'Failed to update approval mode' }, { status: 500 });
      }

      return NextResponse.json({ ok: true, requireApproval: Boolean(requireApproval) });
    }

    // 4. TOGGLE REGISTRATIONS (Open vs Closed)
    if (action === 'toggle_registrations') {
      const { closed } = body;
      const updatedTheme = {
        ...(event.theme || {}),
        registrations_closed: Boolean(closed),
      };

      const { error: regErr } = await supabase
        .from('events')
        .update({
          theme: updatedTheme,
          updated_at: new Date().toISOString(),
        })
        .eq('id', event.id);

      if (regErr) {
        return NextResponse.json({ error: 'Failed to toggle registrations' }, { status: 500 });
      }

      return NextResponse.json({ ok: true, registrationsClosed: Boolean(closed) });
    }

    // 5. UPDATE CAPACITY
    if (action === 'update_capacity') {
      const newCapacity = body.capacity ? Number(body.capacity) : null;
      const updatedTheme = {
        ...(event.theme || {}),
        spots_limit: newCapacity || undefined,
        has_spots_limit: Boolean(newCapacity),
      };

      const { error: capErr } = await supabase
        .from('events')
        .update({
          capacity: newCapacity,
          theme: updatedTheme,
          updated_at: new Date().toISOString(),
        })
        .eq('id', event.id);

      if (capErr) {
        return NextResponse.json({ error: 'Failed to update capacity' }, { status: 500 });
      }

      return NextResponse.json({ ok: true, capacity: newCapacity });
    }

    // 6. DOOR CHECK-IN GUEST (Mark attended)
    if (action === 'check_in_guest') {
      const { rsvpId, attended } = body;
      if (!rsvpId) {
        return NextResponse.json({ error: 'rsvpId is required' }, { status: 400 });
      }

      const { data: existingRsvp } = await supabase
        .from('rsvps')
        .select('custom_responses')
        .eq('id', rsvpId)
        .eq('event_id', event.id)
        .single();

      const updatedResponses = {
        ...(existingRsvp?.custom_responses || {}),
        attended: Boolean(attended),
        attended_at: attended ? new Date().toISOString() : null,
        checked_in_via: 'magic_link_host_sheet',
      };

      const { data: updatedRsvp, error: checkinErr } = await supabase
        .from('rsvps')
        .update({ custom_responses: updatedResponses })
        .eq('id', rsvpId)
        .select()
        .single();

      if (checkinErr) {
        return NextResponse.json({ error: 'Failed to check in guest' }, { status: 500 });
      }

      return NextResponse.json({ ok: true, rsvp: updatedRsvp });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('[Manage API] Error in POST:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
