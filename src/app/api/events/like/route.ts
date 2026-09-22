import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * POST /api/events/like
 * Handles persistent liking / cheering of events & flash vibes in Supabase.
 * Body: { eventId: string, slug?: string, action?: 'like' | 'unlike' }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { eventId, slug, action = 'like' } = body;

    if (!eventId && !slug) {
      return NextResponse.json({ error: 'eventId or slug is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ success: true, message: 'Supabase not configured, local only' });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 1. Locate the event in Supabase
    let query = supabase.from('events').select('id, slug, theme');
    const isUUID = Boolean(eventId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId));

    if (isUUID) {
      query = query.eq('id', eventId);
    } else if (slug) {
      query = query.eq('slug', slug);
    } else if (eventId) {
      query = query.eq('slug', eventId);
    }

    const { data: event, error: fetchErr } = await query.maybeSingle();

    if (fetchErr) {
      console.warn('Could not find event in Supabase to update like count:', fetchErr);
      return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
    }

    if (!event) {
      // Event might be a client-side sample event (e.g. flash-1)
      return NextResponse.json({ success: true, localOnly: true });
    }

    // 2. Read and update theme.vibe_cheers_count
    const currentTheme = (typeof event.theme === 'object' && event.theme !== null) ? event.theme : {};
    const currentCheers = Number(currentTheme.vibe_cheers_count || 0);

    const delta = action === 'unlike' ? -1 : 1;
    const newCheers = Math.max(0, currentCheers + delta);

    const updatedTheme = {
      ...currentTheme,
      vibe_cheers_count: newCheers,
    };

    const { error: updateErr } = await supabase
      .from('events')
      .update({
        theme: updatedTheme,
        updated_at: new Date().toISOString(),
      })
      .eq('id', event.id);

    if (updateErr) {
      console.error('Failed to update event likes in Supabase:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: newCheers,
      liked: action === 'like',
    });
  } catch (err: any) {
    console.error('Unexpected error in /api/events/like:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
