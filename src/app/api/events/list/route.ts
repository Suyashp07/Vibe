import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ events: [] });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: events, error } = await supabase
      .from('events')
      .select('*, profiles:organizer_id(id, name, handle, logo_url, brand_color, email)')
      .order('created_at', { ascending: false });

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
