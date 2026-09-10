import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // 1. Resolve real event UUID from Supabase
    let targetEventId = event_id;

    // If event_id is a slug, dummy ID, or if we have event_slug, query Supabase events table
    if (event_slug || (event_id && (event_id.startsWith('evt-') || event_id.length !== 36))) {
      const query = supabase.from('events').select('id, slug').limit(1);
      if (event_slug) {
        query.eq('slug', event_slug);
      } else {
        query.eq('id', event_id);
      }
      const { data: matchedEvents } = await query;
      if (matchedEvents && matchedEvents.length > 0) {
        targetEventId = matchedEvents[0].id;
      }
    }

    // 2. Insert into public.rsvps
    const insertPayload: any = {
      name: name.trim(),
      email: email.trim(),
      phone: phone || '',
      status: status || 'confirmed',
      plus_one_name: plus_one_name ? plus_one_name.trim() : null,
      custom_responses: custom_responses || {}
    };

    // If valid UUID format, attach event_id
    if (targetEventId && targetEventId.length === 36) {
      insertPayload.event_id = targetEventId;
    } else {
      // Fallback lookup: find any event by slug if available
      if (event_slug) {
        const { data: evBySlug } = await supabase.from('events').select('id').eq('slug', event_slug).maybeSingle();
        if (evBySlug) {
          insertPayload.event_id = evBySlug.id;
        }
      }
    }

    if (!insertPayload.event_id) {
      console.warn('Could not resolve UUID event_id for RSVP, finding first matching event');
      const { data: firstEv } = await supabase.from('events').select('id').limit(1).maybeSingle();
      if (firstEv) {
        insertPayload.event_id = firstEv.id;
      }
    }

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
