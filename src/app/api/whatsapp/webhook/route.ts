import { NextRequest, NextResponse } from 'next/server';
import { whatsappAdapter } from '@/lib/communication/adapters/whatsappAdapter';
import { conversationService } from '@/lib/communication/conversationService';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'Vibe WhatsApp Ingestion Webhook',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Bridge Secret Token if configured
    if (!whatsappAdapter.verifyWebhook(req)) {
      console.warn('[WhatsApp Webhook] Unauthorized webhook request: token mismatch');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();

    // 2. Process incoming message through adapter
    const incomingHostMsg = await whatsappAdapter.processIncomingMessage(payload);
    if (!incomingHostMsg) {
      return NextResponse.json({ ok: true, status: 'ignored_empty' });
    }

    // 2.1 Handle duplicate webhook deliveries safely
    if (incomingHostMsg.isDuplicate) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    // 3. Resolve Conversation
    let conv = null;

    // 3A. Resolve by direct conversationId (if passed by bridge metadata)
    if (incomingHostMsg.conversationId) {
      conv = await conversationService.getConversationById(incomingHostMsg.conversationId);
    }

    // 3B. Resolve by Quoted Message ID (host swiped right to reply to Vibe notification)
    if (!conv && payload.quotedMessageId) {
      conv = await conversationService.resolveConversationByQuotedMessage(payload.quotedMessageId);
    }

    // 4. If mapped to a conversation:
    if (conv) {
      if (conv.status === 'CLOSED') {
        console.warn('[WhatsApp Webhook] Host attempted reply on closed conversation:', conv.id);
        return NextResponse.json({
          ok: true,
          warning: 'Conversation is closed',
          conversationId: conv.id,
        });
      }

      const savedMsg = await conversationService.postHostMessage({
        conversationId: conv.id,
        senderId: incomingHostMsg.senderId || 'whatsapp-host',
        content: incomingHostMsg.messageContent,
        channel: 'WHATSAPP',
        externalMessageId: incomingHostMsg.externalMessageId,
      });

      console.log('[WhatsApp Webhook] Host message routed to Vibe conversation:', {
        conversationId: conv.id,
        messageId: savedMsg.id,
        externalMessageId: incomingHostMsg.externalMessageId,
      });

      return NextResponse.json({
        ok: true,
        handledBy: 'communication_gateway',
        conversationId: conv.id,
        messageId: savedMsg.id,
      });
    }

    // 5. Unmapped Message: Do NOT guess! Safely log and ignore.
    console.warn('[WhatsApp Webhook] Unmapped WhatsApp reply: Quoted message cannot be linked to any active conversation. Safely ignoring.', {
      quotedMessageId: payload.quotedMessageId,
      senderPhone: payload.senderPhone,
    });

    return NextResponse.json({
      ok: true,
      ignored: 'unmapped_message',
      quotedMessageId: payload.quotedMessageId,
    });
  } catch (err: any) {
    console.error('[WhatsApp Webhook] Error processing incoming payload:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
