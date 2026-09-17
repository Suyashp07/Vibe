import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/events/by-slug?slug=<slug>
 * 
 * Fetches a single event by its unique slug.
 * Private events (is_public: false) ARE accessible via this direct lookup,
 * allowing attendees with the secret invite link to view details and RSVP.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug')?.trim();

    if (!slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ event: null });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: event, error } = await supabase
      .from('events')
      .select('*, profiles:organizer_id(id, name, handle, logo_url, brand_color, email)')
      .ilike('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error fetching event by slug:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ event: event || null });
  } catch (err: any) {
    console.error('Error in /api/events/by-slug:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
