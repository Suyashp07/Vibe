import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/adminSupabase';
import {
  getEventbriteOrganizations,
  getEventbriteOrgEvents,
  getEventbriteEventById,
  mapEventbriteToVibeEvent,
} from '@/lib/aggregation/eventbrite';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, organizationId, eventId } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        {
          error: 'Eventbrite Private Token (OAuth Token) is required.',
          hint: 'Go to Eventbrite -> Account Settings -> Developer -> API Keys -> click "Show Client Secret and OAuth Token" -> copy your Private Token.',
        },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();

    // 1. If an eventId is directly provided, fetch single event
    if (eventId) {
      const ebEvent = await getEventbriteEventById(cleanToken, String(eventId));
      const mapped = mapEventbriteToVibeEvent(ebEvent);

      const supabase = getSupabaseAdmin();
      if (supabase) {
        await supabase.from('events').insert([mapped]);
      }

      return NextResponse.json({
        success: true,
        count: 1,
        events: [mapped],
      });
    }

    // 2. Fetch Organizations
    let orgId = organizationId;
    if (!orgId) {
      const orgs = await getEventbriteOrganizations(cleanToken);
      if (!orgs || orgs.length === 0) {
        return NextResponse.json(
          {
            error: 'No Eventbrite organizations found for this token.',
            hint: 'Make sure your Eventbrite account has an active Organization.',
          },
          { status: 404 }
        );
      }
      orgId = orgs[0].id;
    }

    // 3. Fetch events belonging to this Organization
    const ebEvents = await getEventbriteOrgEvents(cleanToken, orgId, 'live');
    if (!ebEvents || ebEvents.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'No live events found in this Eventbrite organization.',
        organizationId: orgId,
      });
    }

    // 4. Map into Vibe format and save to Supabase
    const mappedEvents = ebEvents.map(mapEventbriteToVibeEvent);
    const supabase = getSupabaseAdmin();

    if (supabase) {
      // Ingest without failing on duplicates
      for (const ev of mappedEvents) {
        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('title', ev.title)
          .maybeSingle();

        if (!existing) {
          await supabase.from('events').insert([ev]);
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: mappedEvents.length,
      organizationId: orgId,
      events: mappedEvents,
    });
  } catch (err: any) {
    console.error('Eventbrite Ingestion API Error:', err);
    return NextResponse.json(
      {
        error: err.message || 'Failed to fetch events from Eventbrite',
      },
      { status: 500 }
    );
  }
}
