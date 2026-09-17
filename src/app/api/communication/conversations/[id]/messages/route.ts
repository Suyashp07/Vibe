import { NextRequest, NextResponse } from 'next/server';
import { conversationService } from '@/lib/communication/conversationService';
import { createClient } from '@supabase/supabase-js';
import { SAMPLE_TEMPLATE_EVENTS } from '@/lib/store';
import { EventItem } from '@/types';

export const dynamic = 'force-dynamic';

function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey || supabaseUrl.includes('your-project')) return null;
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}

interface RouteContext {
  params: { id: string };
}

// GET /api/communication/conversations/[id]/messages?requesterId=...
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const requesterId = searchParams.get('requesterId') || undefined;
    const requesterRole = searchParams.get('requesterRole') || undefined;

    const messages = await conversationService.getConversationMessages(id, requesterId, requesterRole);
    return NextResponse.json({ messages });
  } catch (err: any) {
    if (err.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/communication/conversations/[id]/messages
// Sends message from guest -> Telegram host adapter
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: conversationId } = params;
    const body = await req.json();
    const { senderId, content, guestName, event: clientEvent } = body;

    if (!senderId || !content) {
      return NextResponse.json(
        { error: 'Missing required parameters: senderId, content' },
        { status: 400 }
      );
    }

    // 1. Resolve conversation
    const conv = await conversationService.getConversationById(conversationId, senderId);
    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 2. Resolve event details for adapter formatting
    let eventObj: EventItem = clientEvent;
    if (!eventObj) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        const { data } = await supabase.from('events').select('*').eq('id', conv.event_id).maybeSingle();
        if (data) eventObj = data;
      }
    }

    if (!eventObj) {
      eventObj = SAMPLE_TEMPLATE_EVENTS.find((e) => e.id === conv.event_id) || {
        id: conv.event_id,
        title: 'Event Gathering',
        slug: 'event',
        start_at: new Date().toISOString(),
        location_name: 'Venue',
        organizer_name: 'Host',
      } as any;
    }

    // 3. Post guest message through conversation service
    const message = await conversationService.postGuestMessage({
      conversationId: conv.id,
      senderId,
      content,
      event: eventObj,
      guestName: guestName || conv.guest_name,
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (err: any) {
    console.error('Error in POST /api/communication/conversations/[id]/messages:', err.message);

    if (err.message?.includes('closed')) {
      return NextResponse.json({ error: err.message, closed: true }, { status: 400 });
    }
    if (err.message?.includes('Rate limit')) {
      return NextResponse.json({ error: err.message, rateLimited: true }, { status: 429 });
    }
    if (err.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
