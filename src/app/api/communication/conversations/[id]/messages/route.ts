import { NextRequest, NextResponse } from 'next/server';
import { conversationService } from '@/lib/communication/conversationService';
import { verifyCommunicationSession } from '@/lib/communication/auth';
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

// GET /api/communication/conversations/[id]/messages
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const session = await verifyCommunicationSession(req);
    const clientRequesterId = req.nextUrl.searchParams.get('requesterId');
    const effectiveUserId = session?.userId || clientRequesterId;

    if (!effectiveUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: Identity required to access conversation messages' },
        { status: 401 }
      );
    }

    // Load conversation to verify authorization (VULN-01)
    const conv = await conversationService.getConversationById(id);
    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const isGuest =
      conv.guest_id.toLowerCase() === effectiveUserId.toLowerCase() ||
      (session && conv.guest_email?.toLowerCase() === session.email.toLowerCase());
    const isHost =
      conv.host_id.toLowerCase() === effectiveUserId.toLowerCase() ||
      (session && session.userId.toLowerCase() === conv.host_id.toLowerCase());
    const isSuperAdmin = session?.isSuperAdmin === true;

    if (!isGuest && !isHost && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this conversation.' },
        { status: 403 }
      );
    }

    const messages = await conversationService.getConversationMessages(
      id,
      effectiveUserId,
      isSuperAdmin ? 'super_admin' : undefined
    );
    return NextResponse.json({ messages });
  } catch (err: any) {
    console.error('Error in GET /api/communication/conversations/[id]/messages:', err);
    if (err.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to retrieve messages' }, { status: 500 });
  }
}

// POST /api/communication/conversations/[id]/messages
// Sends message from guest -> Telegram host adapter
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id: conversationId } = params;
    const session = await verifyCommunicationSession(req);
    const body = await req.json();
    const { senderId, content, guestName } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
    }

    // 1. Resolve conversation from authoritative store
    const conv = await conversationService.getConversationById(conversationId);
    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 2. Determine verified sender identity (VULN-02)
    const effectiveSenderId = session?.userId || senderId;
    if (!effectiveSenderId) {
      return NextResponse.json(
        { error: 'Unauthorized: Sender identity required' },
        { status: 401 }
      );
    }

    // Ensure sender is the verified guest of this conversation (or super_admin)
    const isGuest =
      conv.guest_id.toLowerCase() === effectiveSenderId.toLowerCase() ||
      (session && conv.guest_email?.toLowerCase() === session.email.toLowerCase());
    const isSuperAdmin = session?.isSuperAdmin === true;

    if (!isGuest && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: You are not a participant in this conversation.' },
        { status: 403 }
      );
    }

    // 3. Resolve event strictly from authoritative database using conv.event_id (VULN-08)
    // NEVER trust client-supplied event object
    let eventObj: EventItem | null = null;
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase.from('events').select('*').eq('id', conv.event_id).maybeSingle();
      if (data) eventObj = data;
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

    // 4. Post guest message through conversation service
    const message = await conversationService.postGuestMessage({
      conversationId: conv.id,
      senderId: effectiveSenderId,
      content,
      event: eventObj!,
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

    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
