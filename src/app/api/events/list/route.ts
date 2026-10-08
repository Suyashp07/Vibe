import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/events/list
 * 
 * Public discovery endpoint. Strictly returns public live events by default.
 * Private events (is_public: false) are NEVER included in public listings.
 */
export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ events: [] });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { searchParams } = new URL(request.url);
    const organizerId = searchParams.get('organizer_id');
    const includePrivate = searchParams.get('include_private') === 'true';

    let query = supabase
      .from('events')
      .select('*, profiles:organizer_id(id, name, handle, logo_url, brand_color, email)');

    // If an organizer is querying their own workstation events, allow status filtering or all statuses
    if (organizerId) {
      query = query.eq('organizer_id', organizerId);
    } else {
      // Public discovery endpoint: strictly live events only
      query = query.eq('status', 'live');
    }

    // Strictly enforce privacy: public listings ONLY return is_public = true.
    // Private events (is_public: false) are NEVER included in public discovery.
    // They are only accessible to the host when organizerId is explicitly provided.
    if (!includePrivate || !organizerId) {
      query = query.eq('is_public', true);
    }

    const { data: events, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch events from Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const includePast = searchParams.get('include_past') === 'true';
    const now = Date.now();

    // Filter out unapproved and expired events for public listings:
    // If an event has approval_status === 'pending' or (confidence_score < 0.9 and not admin approved),
    // it must not be visible on the public site until an admin approves it.
    const filteredEvents = (events || []).filter((e) => {
      // If this is a public discovery listing (no organizerId or includePrivate is false),
      // ensure NO private event can EVER leak through regardless of DB columns.
      if (!includePrivate || !organizerId) {
        if (e.is_public === false || String(e.is_public) === 'false') return false;
        if (e.is_private === true || String(e.is_private) === 'true') return false;
        if (e.visibility === 'private') return false;
        const cfg = e.rsvp_form_config;
        if (cfg && (cfg.is_private === true || cfg.is_public === false || cfg.visibility === 'private')) {
          return false;
        }

        const approvalStatus = e.approval_status || e.theme?.approval_status;
        if (approvalStatus === 'pending') return false;
        const isAdminApproved = e.admin_approved === true || e.theme?.admin_approved === true;
        const score = e.confidence_score ?? e.theme?.confidence_score;
        if (score !== undefined && score !== null && score < 0.9 && !isAdminApproved) {
          return false;
        }

        // Exclude expired / past events from public discovery feeds unless explicitly requested
        if (!includePast) {
          if (e.status === 'past' || e.status === 'cancelled') return false;
          if (e.end_at) {
            const endTime = new Date(e.end_at).getTime();
            if (!isNaN(endTime) && endTime < now) return false;
          } else if (e.start_at) {
            const startTime = new Date(e.start_at).getTime();
            if (!isNaN(startTime) && (startTime + 4 * 60 * 60 * 1000) < now) return false;
          }
        }
      }

      return true;
    });

    return NextResponse.json({ events: filteredEvents });
  } catch (err: any) {
    console.error('Error in /api/events/list:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
