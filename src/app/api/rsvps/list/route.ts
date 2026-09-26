import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId')?.trim();
    const eventSlug = searchParams.get('eventSlug')?.trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ rsvps: [], count: 0 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Targeted single event RSVP lookup
    if (eventId || eventSlug) {
      let resolvedId = eventId;
      if (!resolvedId && eventSlug) {
        const { data: ev } = await supabase
          .from('events')
          .select('id')
          .eq('slug', eventSlug)
          .maybeSingle();
        if (ev?.id) resolvedId = ev.id;
      }

      if (resolvedId) {
        const { data: rsvps, count, error } = await supabase
          .from('rsvps')
          .select('*', { count: 'exact' })
          .eq('event_id', resolvedId)
          .eq('status', 'confirmed');

        if (error) {
          console.error('Failed to fetch event rsvps from Supabase:', error);
          return NextResponse.json({ error: error.message, count: 0, rsvps: [] }, { status: 500 });
        }

        return NextResponse.json({ count: count || rsvps?.length || 0, rsvps: rsvps || [] });
      }

      return NextResponse.json({ count: 0, rsvps: [] });
    }

    // Full RSVP list for admin
    const { data: rsvps, count, error } = await supabase
      .from('rsvps')
      .select('*, events:event_id(id, slug, title, organizer_id)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch rsvps from Supabase:', error);
      return NextResponse.json({ error: error.message, count: 0, rsvps: [] }, { status: 500 });
    }

    return NextResponse.json({ rsvps: rsvps || [], count: count || rsvps?.length || 0 });
  } catch (err: any) {
    console.error('Error in /api/rsvps/list:', err);
    return NextResponse.json({ error: err.message, count: 0, rsvps: [] }, { status: 500 });
  }
}
