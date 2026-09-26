import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('your-project')) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * GET /api/events/comments?eventId=...
 * Returns all comments for a given event, ordered newest-first.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ comments: [], count: 0 });
    }

    // Resolve event UUID if slug provided
    let resolvedEventId = eventId;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
    if (!isUUID) {
      const { data: evt } = await supabase
        .from('events')
        .select('id')
        .eq('slug', eventId)
        .maybeSingle();
      if (evt) resolvedEventId = evt.id;
    }

    const { data: comments, error } = await supabase
      .from('event_comments')
      .select('id, event_id, user_name, user_email, user_avatar, content, created_at')
      .eq('event_id', resolvedEventId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.warn('[Comments API] Query error:', error.message);
      return NextResponse.json({ comments: [], count: 0, note: error.message });
    }

    // Get total count
    const { count } = await supabase
      .from('event_comments')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', resolvedEventId);

    return NextResponse.json({
      comments: comments || [],
      count: count || (comments?.length ?? 0),
    });
  } catch (err: any) {
    console.error('[Comments API] GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/events/comments
 * Create a new comment on an event.
 * Body: { eventId, content, userName?, userEmail?, userAvatar? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, content, userName, userEmail, userAvatar } = body;

    if (!eventId || !content?.trim()) {
      return NextResponse.json(
        { error: 'eventId and content are required' },
        { status: 400 }
      );
    }

    if (content.trim().length > 500) {
      return NextResponse.json(
        { error: 'Comment must be 500 characters or less' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      // Fallback: return a mock comment if DB not configured
      return NextResponse.json({
        success: true,
        comment: {
          id: `cmt-${Date.now()}`,
          event_id: eventId,
          user_name: userName || 'Guest',
          user_email: userEmail || null,
          user_avatar: userAvatar || null,
          content: content.trim(),
          created_at: new Date().toISOString(),
        },
      });
    }

    // Resolve event UUID if slug provided
    let resolvedEventId = eventId;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
    if (!isUUID) {
      const { data: evt } = await supabase
        .from('events')
        .select('id')
        .eq('slug', eventId)
        .maybeSingle();
      if (evt) resolvedEventId = evt.id;
    }

    const { data: comment, error } = await supabase
      .from('event_comments')
      .insert({
        event_id: resolvedEventId,
        user_name: (userName || 'Guest').trim().slice(0, 50),
        user_email: userEmail?.toLowerCase().trim() || null,
        user_avatar: userAvatar || null,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Comments API] Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, comment });
  } catch (err: any) {
    console.error('[Comments API] POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
