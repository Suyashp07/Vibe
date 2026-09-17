import { NextRequest, NextResponse } from 'next/server';
import { conversationService } from '@/lib/communication/conversationService';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

// GET /api/communication/conversations/[id]?requesterId=...
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const requesterId = searchParams.get('requesterId') || undefined;
    const requesterRole = searchParams.get('requesterRole') || undefined;

    const conversation = await conversationService.getConversationById(id, requesterId, requesterRole);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ conversation });
  } catch (err: any) {
    if (err.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/communication/conversations/[id]
// Allows host to close or reopen conversation
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status, requesterId } = body;

    if (!status || !requesterId) {
      return NextResponse.json(
        { error: 'Missing required status or requesterId' },
        { status: 400 }
      );
    }

    let updated;
    if (status === 'CLOSED') {
      updated = await conversationService.closeConversation(id, requesterId);
    } else if (status === 'OPEN') {
      updated = await conversationService.reopenConversation(id, requesterId);
    } else {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, conversation: updated });
  } catch (err: any) {
    if (err.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
