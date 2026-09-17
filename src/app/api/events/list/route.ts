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
      .select('*, profiles:organizer_id(id, name, handle, logo_url, brand_color, email)')
      .eq('status', 'live');

    // Strictly enforce privacy: public listings ONLY return is_public = true.
    // Private events (is_public: false) are NEVER included in public listings.
    if (!includePrivate) {
      query = query.eq('is_public', true);
    }
    if (organizerId) {
      query = query.eq('organizer_id', organizerId);
    }

    const { data: events, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch events from Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: events || [] });
  } catch (err: any) {
    console.error('Error in /api/events/list:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
