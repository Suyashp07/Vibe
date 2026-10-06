import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyTicketHash } from '@/lib/ticketSecurity';

export const dynamic = 'force-dynamic';

function parseScannedData(raw: string): {
  rsvpId?: string;
  eventId?: string;
  hash?: string;
  timeSlice?: number;
} {
  const clean = raw.trim();

  // 1. JSON string format: { "v": 1, "r": "...", "e": "...", "t": 123, "h": "..." }
  if (clean.startsWith('{') && clean.endsWith('}')) {
    try {
      const parsed = JSON.parse(clean);
      return {
        rsvpId: parsed.r || parsed.rsvpId || parsed.id,
        eventId: parsed.e || parsed.eventId,
        hash: parsed.h || parsed.hash,
        timeSlice: parsed.t || parsed.timeSlice,
      };
    } catch {
      // not valid JSON, proceed to other checks
    }
  }

  // 2. URL format: .../organizer/check-in?rsvpId=...&eventId=...&h=...
  if (clean.includes('http://') || clean.includes('https://') || clean.includes('check-in?')) {
    try {
      const url = new URL(clean.startsWith('http') ? clean : `https://dummy.com/${clean}`);
      const rsvpId = url.searchParams.get('rsvpId') || url.searchParams.get('r') || url.searchParams.get('guest');
      const eventId = url.searchParams.get('eventId') || url.searchParams.get('e');
      const hash = url.searchParams.get('h') || url.searchParams.get('hash');
      const timeSlice = parseInt(url.searchParams.get('t') || url.searchParams.get('timeSlice') || '', 10);
      return {
        rsvpId: rsvpId || undefined,
        eventId: eventId || undefined,
        hash: hash || undefined,
        timeSlice: isNaN(timeSlice) ? undefined : timeSlice,
      };
    } catch {
      // not valid URL
    }
  }

  // 3. Raw RSVP ID or UUID
  return { rsvpId: clean };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { rsvpId, eventId, hash, timeSlice, rawScan, action } = body;

    // If rawScan is provided from the camera scanner
    if (rawScan) {
      const parsed = parseScannedData(rawScan);
      if (parsed.rsvpId) rsvpId = parsed.rsvpId;
      if (parsed.eventId) eventId = parsed.eventId;
      if (parsed.hash) hash = parsed.hash;
      if (parsed.timeSlice) timeSlice = parsed.timeSlice;
    }

    if (!rsvpId) {
      return NextResponse.json(
        { valid: false, error: 'Missing RSVP or ticket identifier in scanned data.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { valid: false, error: 'Database service credentials unavailable.' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 1. Fetch the RSVP record
    let rsvpQuery = supabase
      .from('rsvps')
      .select('*, events:event_id(id, title, start_at, location_name, city, organizer_id)')
      .or(`id.eq.${rsvpId},phone.eq.${rsvpId},email.ilike.${rsvpId}`);

    // If it looks like a standard UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rsvpId);
    if (isUuid) {
      rsvpQuery = supabase
        .from('rsvps')
        .select('*, events:event_id(id, title, start_at, location_name, city, organizer_id)')
        .eq('id', rsvpId);
    }

    const { data: rows, error: fetchErr } = await rsvpQuery.limit(1);

    if (fetchErr) {
      console.error('RSVP verification DB query error:', fetchErr);
      return NextResponse.json(
        { valid: false, error: `Database lookup failed: ${fetchErr.message}` },
        { status: 500 }
      );
    }

    const rsvp = rows?.[0];
    if (!rsvp) {
      return NextResponse.json({
        valid: false,
        status: 'not_found',
        error: `No RSVP found matching "${rsvpId}". Ensure ticket is registered.`,
      });
    }

    const resolvedEvent = rsvp.events;

    // 2. Cryptographic Time-Hash Validation (Anti-Screenshot verification)
    let hashVerification = null;
    if (hash && rsvp.id && (eventId || resolvedEvent?.id)) {
      const targetEventId = eventId || resolvedEvent?.id;
      hashVerification = verifyTicketHash(rsvp.id, targetEventId, hash, timeSlice);
      if (!hashVerification.valid) {
        return NextResponse.json({
          valid: false,
          status: 'expired_or_invalid_hash',
          error: 'Dynamic security hash expired or invalid. Please refresh the guest pass on screen.',
          rsvp: {
            id: rsvp.id,
            name: rsvp.name,
            email: rsvp.email,
          },
        });
      }
    }

    // 3. Status checks
    if (rsvp.status === 'cancelled') {
      return NextResponse.json({
        valid: false,
        status: 'cancelled',
        error: 'This ticket was cancelled and is void.',
        rsvp: {
          id: rsvp.id,
          name: rsvp.name,
          email: rsvp.email,
          status: rsvp.status,
          event_title: resolvedEvent?.title,
        },
      });
    }

    if (rsvp.status === 'waitlisted') {
      return NextResponse.json({
        valid: false,
        status: 'waitlisted',
        error: 'Guest is on the waitlist and has not been confirmed for admission.',
        rsvp: {
          id: rsvp.id,
          name: rsvp.name,
          email: rsvp.email,
          status: rsvp.status,
          event_title: resolvedEvent?.title,
        },
      });
    }

    // 4. Check if already attended
    const customResp = rsvp.custom_responses || {};
    const alreadyAttended = customResp.attended === true || rsvp.status === 'attended';
    const attendedAt = customResp.attended_at;

    if (alreadyAttended && action !== 'force') {
      return NextResponse.json({
        valid: true,
        already_attended: true,
        status: 'already_attended',
        message: 'Ticket already checked in previously!',
        attended_at: attendedAt,
        rsvp: {
          id: rsvp.id,
          name: rsvp.name,
          email: rsvp.email,
          phone: rsvp.phone,
          plus_one_name: rsvp.plus_one_name,
          status: rsvp.status,
          attended: true,
          attended_at: attendedAt,
          event_title: resolvedEvent?.title,
          event_date: resolvedEvent?.start_at,
          event_location: resolvedEvent?.location_name,
        },
      });
    }

    // 5. Mark as attended (Check-in)
    const nowIso = new Date().toISOString();
    const updatedResponses = {
      ...customResp,
      attended: true,
      attended_at: nowIso,
      checked_in_via: 'organizer_scanner_pwa',
    };

    const { error: updateErr } = await supabase
      .from('rsvps')
      .update({
        custom_responses: updatedResponses,
      })
      .eq('id', rsvp.id);

    if (updateErr) {
      console.error('Check-in status update error:', updateErr);
      return NextResponse.json(
        { valid: false, error: `Failed to record admission: ${updateErr.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      valid: true,
      already_attended: false,
      status: 'success',
      message: 'Verified! Admission granted.',
      attended_at: nowIso,
      rsvp: {
        id: rsvp.id,
        name: rsvp.name,
        email: rsvp.email,
        phone: rsvp.phone,
        plus_one_name: rsvp.plus_one_name,
        status: 'confirmed',
        attended: true,
        attended_at: nowIso,
        event_title: resolvedEvent?.title,
        event_date: resolvedEvent?.start_at,
        event_location: resolvedEvent?.location_name,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/rsvps/verify:', err);
    return NextResponse.json(
      { valid: false, error: err?.message || 'Server error processing verification' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rsvpId = searchParams.get('rsvpId') || searchParams.get('id');
  const eventId = searchParams.get('eventId');
  const hash = searchParams.get('h') || searchParams.get('hash');
  const timeSlice = parseInt(searchParams.get('t') || '', 10);

  if (!rsvpId) {
    return NextResponse.json({ error: 'Missing rsvpId query parameter' }, { status: 400 });
  }

  // Forward to POST handler
  return POST(
    new Request(req.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rsvpId,
        eventId,
        hash,
        timeSlice: isNaN(timeSlice) ? undefined : timeSlice,
        action: 'lookup',
      }),
    })
  );
}
