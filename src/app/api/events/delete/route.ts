import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { id, slug } = await req.json();

    if (!id && !slug) {
      return NextResponse.json({ error: 'Missing event id or slug' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Check if id is a valid UUID
    const isUUID = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    let query = supabase.from('events').delete();

    if (isUUID && slug) {
      query = query.or(`id.eq.${id},slug.eq.${slug}`);
    } else if (isUUID) {
      query = query.eq('id', id);
    } else if (slug) {
      query = query.eq('slug', slug);
    } else {
      query = query.eq('slug', id);
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Event successfully deleted from Supabase',
      deleted: data,
    });
  } catch (err: any) {
    console.error('Error in /api/events/delete:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
