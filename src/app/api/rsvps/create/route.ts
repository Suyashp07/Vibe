import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generatePassSerial } from '@/lib/ticketSecurity';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      event_id,
      event_slug,
      name,
      email,
      phone,
      status = 'confirmed',
      plus_one_name,
      custom_responses = {}
    } = body;

    if (!name || !email || (!event_id && !event_slug)) {
      return NextResponse.json({ error: 'Missing required RSVP fields' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    // 1. Resolve real event UUID and verify platform source from Supabase
    let targetEventId = event_id;
    let targetEvent: any = null;

    // If event_id is a slug, dummy ID, or if we have event_slug, query Supabase events table
    if (event_slug || (event_id && (event_id.startsWith('evt-') || event_id.length !== 36))) {
      const query = supabase
        .from('events')
        .select('id, slug, status, source_type, source_platform, external_ticket_url, city, event_type')
        .limit(1);
      if (event_slug) {
        query.eq('slug', event_slug);
      } else {
        query.eq('id', event_id);
      }
      const { data: matchedEvents } = await query;
      if (matchedEvents && matchedEvents.length > 0) {
        targetEvent = matchedEvents[0];
        targetEventId = targetEvent.id;
      }
    } else if (targetEventId && targetEventId.length === 36) {
      const { data: matched } = await supabase
        .from('events')
        .select('id, slug, status, source_type, source_platform, external_ticket_url, city, event_type')
        .eq('id', targetEventId)
        .maybeSingle();
      if (matched) {
        targetEvent = matched;
      }
    }

    // STRICT RULE: Cannot RSVP to draft/unverified events
    if (targetEvent?.status === 'draft') {
      return NextResponse.json(
        {
          error: 'This event is currently pending administrator verification and is not open for RSVPs yet.',
        },
        { status: 400 }
      );
    }

    // STRICT RULE: RSVPs can ONLY be created for Vibe-specific native platform events
    if (targetEvent?.source_type === 'external') {
      return NextResponse.json(
        {
          error: `RSVPs for this event cannot be created on Vibe. Please register directly on ${targetEvent.source_platform ? targetEvent.source_platform.toUpperCase() : 'the official platform'}.`,
          redirect_url: targetEvent.external_ticket_url || null
        },
        { status: 400 }
      );
    }

    // 2. Resolve event_id
    let resolvedEventId = targetEventId && targetEventId.length === 36 ? targetEventId : null;
    if (!resolvedEventId && event_slug) {
      const { data: evBySlug } = await supabase.from('events').select('id').eq('slug', event_slug).maybeSingle();
      if (evBySlug) {
        resolvedEventId = evBySlug.id;
      }
    }
    if (!resolvedEventId) {
      const { data: firstEv } = await supabase.from('events').select('id').limit(1).maybeSingle();
      if (firstEv) {
        resolvedEventId = firstEv.id;
      }
    }

    // Deduplication check: if attendee already registered in Supabase for this event, return confirmed record
    if (resolvedEventId && email) {
      const { data: existingRsvp } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', resolvedEventId)
        .ilike('email', email.trim())
        .maybeSingle();

      if (existingRsvp) {
        return NextResponse.json({ success: true, rsvp: existingRsvp });
      }
    }

    // 3. Assign structured sequential pass serial number
    let passSerial = body.pass_serial || custom_responses?.pass_serial;
    let enrollmentNumber = custom_responses?.enrollment_number;

    if (!passSerial && resolvedEventId) {
      // Count existing RSVPs in Supabase for this event to get the next sequential number
      const { count } = await supabase
        .from('rsvps')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', resolvedEventId);

      enrollmentNumber = (count || 0) + 1;
      passSerial = generatePassSerial({
        city: targetEvent?.city,
        sequenceNumber: enrollmentNumber,
        status: status || 'confirmed',
        isOnline: targetEvent?.event_type === 'online',
      });
    }

    const mergedCustomResponses = {
      ...(custom_responses || {}),
      pass_serial: passSerial,
      enrollment_number: enrollmentNumber || 1,
    };

    const insertPayload: any = {
      event_id: resolvedEventId,
      name: name.trim(),
      email: email.trim(),
      phone: phone || '',
      status: status || 'confirmed',
      plus_one_name: plus_one_name ? plus_one_name.trim() : null,
      custom_responses: mergedCustomResponses,
    };

    const { data: insertedRsvp, error: insertError } = await supabase
      .from('rsvps')
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      console.error('Supabase RSVP insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, rsvp: insertedRsvp });
  } catch (err: any) {
    console.error('Error in /api/rsvps/create:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
