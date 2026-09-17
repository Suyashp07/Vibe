import { NextRequest, NextResponse } from 'next/server';
import { conversationService } from '@/lib/communication/conversationService';
import { verifyCommunicationSession, sanitizeConversationForClient } from '@/lib/communication/auth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

// GET /api/communication/conversations/[id]
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const session = await verifyCommunicationSession(req);

    // Fetch conversation from service
    const conversation = await conversationService.getConversationById(id);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Determine authorization: Requester must be the guest, the host, or super_admin (VULN-01)
    const clientRequesterId = req.nextUrl.searchParams.get('requesterId');
    const effectiveUserId = session?.userId || clientRequesterId;

    if (!effectiveUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: Identity required to access conversation' },
        { status: 401 }
      );
    }

    const isGuest =
      conversation.guest_id.toLowerCase() === effectiveUserId.toLowerCase() ||
      (session && conversation.guest_email?.toLowerCase() === session.email.toLowerCase());
    const isHost =
      conversation.host_id.toLowerCase() === effectiveUserId.toLowerCase() ||
      (session && session.userId.toLowerCase() === conversation.host_id.toLowerCase());
    const isSuperAdmin = session?.isSuperAdmin === true;

    if (!isGuest && !isHost && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: You do not have access to this conversation.' },
        { status: 403 }
      );
    }

    // Strip internal Telegram identifiers from client response (VULN-05)
    return NextResponse.json({ conversation: sanitizeConversationForClient(conversation) });
  } catch (err: any) {
    console.error('Error in GET /api/communication/conversations/[id]:', err);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}

// PATCH /api/communication/conversations/[id]
// Allows verified host or super_admin to close or reopen conversation
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const session = await verifyCommunicationSession(req);
    const body = await req.json();
    const { status, requesterId } = body;

    if (!status) {
      return NextResponse.json({ error: 'Missing required status' }, { status: 400 });
    }

    // Load existing conversation
    const conversation = await conversationService.getConversationById(id);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Verify host authorization (VULN-04)
    const effectiveHostId = session?.userId || requesterId;
    if (!effectiveHostId) {
      return NextResponse.json(
        { error: 'Unauthorized: Host identity required' },
        { status: 401 }
      );
    }

    const isHost =
      conversation.host_id.toLowerCase() === effectiveHostId.toLowerCase() ||
      (session && session.userId.toLowerCase() === conversation.host_id.toLowerCase());
    const isSuperAdmin = session?.isSuperAdmin === true;

    if (!isHost && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only the event host can modify conversation status.' },
        { status: 403 }
      );
    }

    let updated;
    if (status === 'CLOSED') {
      updated = await conversationService.closeConversation(id, effectiveHostId);
    } else if (status === 'OPEN') {
      updated = await conversationService.reopenConversation(id, effectiveHostId);
    } else {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      conversation: sanitizeConversationForClient(updated),
    });
  } catch (err: any) {
    console.error('Error in PATCH /api/communication/conversations/[id]:', err);
    if (err.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update conversation status' }, { status: 500 });
  }
}
