import { NextRequest, NextResponse } from 'next/server';
import { conversationService } from '@/lib/communication/conversationService';
import { verifyCommunicationSession, sanitizeConversationForClient } from '@/lib/communication/auth';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !serviceKey || supabaseUrl.includes('your-project')) return null;
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}

// POST /api/communication/conversations
// Find or create conversation for an event + guest
export async function POST(req: NextRequest) {
  try {
    const session = await verifyCommunicationSession(req);
    const body = await req.json();
    const { eventId, guestId, hostId, guestName, guestEmail } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing required parameter: eventId' },
        { status: 400 }
      );
    }

    // Determine verified guest identity: Session takes absolute priority over client body
    let effectiveGuestId = session?.userId || guestId;
    let effectiveGuestEmail = session?.email || guestEmail;
    let effectiveGuestName = guestName;

    // Reject static generic fallback identifiers that cause cross-guest collisions (VULN-10)
    if (!effectiveGuestId || effectiveGuestId === 'guest-session' || effectiveGuestId.trim() === '') {
      return NextResponse.json(
        { error: 'Unauthorized: A valid guest identity is required to start a conversation.' },
        { status: 401 }
      );
    }

    // If session is active, verify that client is not attempting to impersonate another guest (VULN-02)
    if (session && guestId && guestId !== session.userId && guestId !== session.email && !session.isSuperAdmin) {
      effectiveGuestId = session.userId;
      effectiveGuestEmail = session.email;
    }

    // Resolve authoritative host directly from event record (VULN-01, VULN-04)
    let resolvedHostId = hostId;
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data: eventData } = await supabase
        .from('events')
        .select('id, organizer_id, organizer_handle, title')
        .eq('id', eventId)
        .maybeSingle();

      if (eventData) {
        resolvedHostId = eventData.organizer_id || eventData.organizer_handle || hostId || 'swaniki';
      }
    }

    if (!resolvedHostId) {
      resolvedHostId = 'swaniki';
    }

    // RSVP GATE: Verify guest has RSVP'd before allowing conversation creation
    if (supabase) {
      try {
        const guestIdentifier = effectiveGuestEmail || effectiveGuestId;
        const { data: rsvpRecord } = await supabase
          .from('rsvps')
          .select('id, status')
          .eq('event_id', eventId)
          .or(`email.eq.${guestIdentifier},guest_email.eq.${guestIdentifier}`)
          .maybeSingle();

        if (!rsvpRecord || rsvpRecord.status === 'cancelled') {
          return NextResponse.json(
            { error: 'You must RSVP for this event before contacting the host. Tap "I\'m In" to reserve your spot first.' },
            { status: 403 }
          );
        }
      } catch (rsvpErr) {
        // If RSVP check fails (e.g. table doesn't exist), allow conversation to proceed
        console.warn('[Conversations API] RSVP gate check warning (non-blocking):', rsvpErr);
      }
    }

    const conversation = await conversationService.findOrCreateConversation({
      eventId,
      guestId: effectiveGuestId,
      hostId: resolvedHostId,
      guestName: effectiveGuestName,
      guestEmail: effectiveGuestEmail,
      guestChannel: 'WEB',
      hostChannel: 'TELEGRAM',
    });

    // Strip private infrastructure details before responding to client (VULN-05)
    return NextResponse.json({
      success: true,
      conversation: sanitizeConversationForClient(conversation),
    });
  } catch (err: any) {
    console.error('Error in POST /api/communication/conversations:', err);
    return NextResponse.json({ error: 'Failed to initialize conversation' }, { status: 500 });
  }
}

// GET /api/communication/conversations?userId=...&role=guest|host
export async function GET(req: NextRequest) {
  try {
    const session = await verifyCommunicationSession(req);
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');
    const role = (searchParams.get('role') || 'guest') as 'guest' | 'host';

    if (!requestedUserId) {
      return NextResponse.json({ error: 'Missing required userId parameter' }, { status: 400 });
    }

    // Enforce Authorization: Caller can only list their own conversations unless super_admin (VULN-03)
    if (session) {
      const isOwner =
        session.userId.toLowerCase() === requestedUserId.toLowerCase() ||
        session.email.toLowerCase() === requestedUserId.toLowerCase();
      if (!isOwner && !session.isSuperAdmin) {
        return NextResponse.json(
          { error: 'Unauthorized: You do not have permission to view conversations for this user.' },
          { status: 403 }
        );
      }
    } else {
      // Unauthenticated callers cannot enumerate conversations across users
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to list conversations.' },
        { status: 401 }
      );
    }

    const conversations = await conversationService.getConversationsForUser(requestedUserId, role);
    const sanitizedList = conversations.map(sanitizeConversationForClient);

    return NextResponse.json({ conversations: sanitizedList });
  } catch (err: any) {
    console.error('Error in GET /api/communication/conversations:', err);
    return NextResponse.json({ error: 'Failed to retrieve conversations' }, { status: 500 });
  }
}
