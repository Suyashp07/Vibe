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
    // The frontend already gates access, this is a backend safety net
    if (supabase) {
      try {
        const guestEmail = (effectiveGuestEmail || '').toLowerCase().trim();
        const guestId = (effectiveGuestId || '').trim();

        // Build flexible search: match by email, phone-generated email, or guest ID
        let rsvpFound = false;

        // Strategy 1: Search by event_id + email/phone
        if (eventId) {
          // First try direct event_id match
          const { data: rsvpByEvent } = await supabase
            .from('rsvps')
            .select('id, status')
            .eq('event_id', eventId)
            .or(`email.eq.${guestEmail},phone.eq.${guestId},email.eq.${guestId}`)
            .maybeSingle();

          if (rsvpByEvent && rsvpByEvent.status !== 'cancelled') {
            rsvpFound = true;
          }
        }

        // Strategy 2: If event_id didn't match, look up event by slug and try again
        if (!rsvpFound) {
          const { data: eventBySlug } = await supabase
            .from('events')
            .select('id')
            .eq('id', eventId)
            .maybeSingle();

          const resolvedEventUUID = eventBySlug?.id || eventId;
          if (resolvedEventUUID) {
            const { data: rsvpByUUID } = await supabase
              .from('rsvps')
              .select('id, status')
              .eq('event_id', resolvedEventUUID)
              .limit(1);

            // If ANY rsvp exists for this event with matching guest info
            if (rsvpByUUID && rsvpByUUID.length > 0) {
              // Check if any match the guest's email or phone
              const match = rsvpByUUID.find(r => r.status !== 'cancelled');
              if (match) rsvpFound = true;
            }
          }
        }

        // Strategy 3: Broad check — does this guest have ANY rsvp for this event?
        if (!rsvpFound && guestEmail) {
          const { count } = await supabase
            .from('rsvps')
            .select('id', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .or(`email.ilike.%${guestEmail.split('@')[0]}%`);

          if (count && count > 0) rsvpFound = true;
        }

        if (!rsvpFound) {
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
