import assert from 'assert';
import http from 'http';
import { conversationService } from '../src/lib/communication/conversationService';
import { whatsappAdapter } from '../src/lib/communication/adapters/whatsappAdapter';

// Setup environment for testing
process.env.WHATSAPP_BRIDGE_URL = 'http://127.0.0.1:3099';
process.env.WHATSAPP_BRIDGE_SECRET = 'vibe_wa_sec_test_token_123';
process.env.WHATSAPP_HOST_PHONE = '919876543210';
process.env.WHATSAPP_WEBHOOK_SECRET = 'vibe_wa_sec_test_token_123';

console.log('===============================================================');
console.log('📱 RUNNING WHATSAPP FLOW (OPTION B: QR BRIDGE) TEST SUITE');
console.log('===============================================================');

async function runWhatsAppTests() {
  const TEST_PORT = 3099;
  let receivedBridgeRequest: any = null;

  // 1. Mock Bridge Server
  const mockBridgeServer = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/send-message') {
      const auth = req.headers['authorization'];
      if (auth !== `Bearer ${process.env.WHATSAPP_BRIDGE_SECRET}`) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
      }

      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        receivedBridgeRequest = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, messageId: 'wamid.HBgMTEST998877' }));
      });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => mockBridgeServer.listen(TEST_PORT, '127.0.0.1', resolve));

  try {
    // -------------------------------------------------------------
    // TEST 1: Find or Create Conversation with hostChannel = 'WHATSAPP'
    // -------------------------------------------------------------
    console.log('\n--- Step 1: Create Conversation for WhatsApp Host ---');
    const guestId = `guest-wa-${Date.now()}`;
    const hostId = `host-wa-priya`;
    const eventId = `event-wa-${Date.now()}`;

    const conv = await conversationService.findOrCreateConversation({
      eventId,
      guestId,
      hostId,
      guestName: 'Suyash +919999999999', // contains phone to test privacy
      guestEmail: 'suyash@vibe.fyi',
      guestChannel: 'WEB',
      hostChannel: 'WHATSAPP',
    });

    assert(conv.id, 'Conversation created successfully');
    assert(conv.host_channel === 'WHATSAPP', 'host_channel is WHATSAPP');
    console.log('✅ [PASS] Conversation initialized with host_channel: WHATSAPP');

    // -------------------------------------------------------------
    // TEST 2: Outbound Guest Message -> WhatsApp Bridge Dispatch
    // -------------------------------------------------------------
    console.log('\n--- Step 2: Guest Inquires -> Dispatched to WhatsApp Bridge ---');
    const guestMsg = await conversationService.postGuestMessage({
      conversationId: conv.id,
      senderId: guestId,
      content: 'Is parking available near the stadium?',
      event: {
        id: eventId,
        title: 'BTI Ground Cricket Match',
        slug: 'bti-ground-cricket-match',
      } as any,
    });

    assert(guestMsg.id, 'Guest message created');
    assert(guestMsg.delivery_status === 'SENT', 'Delivery status is SENT');
    assert(guestMsg.external_message_id === 'wamid.HBgMTEST998877', 'External message ID matches bridge response');
    console.log('✅ [PASS] Guest message sent and status updated to SENT with external ID');

    // Verify Bridge Payload & Privacy
    assert(receivedBridgeRequest !== null, 'Bridge received the HTTP dispatch');
    assert(receivedBridgeRequest.to === '919876543210', 'Dispatched to host phone');
    assert(receivedBridgeRequest.text.includes('*VIBE*'), 'Formatted with *VIBE* bold title');
    assert(receivedBridgeRequest.text.includes('*Event:* BTI Ground Cricket Match'), 'Contains event title');
    assert(receivedBridgeRequest.text.includes('Is parking available'), 'Contains question text');
    assert(receivedBridgeRequest.text.includes('Swipe right and reply'), 'Contains reply instructions');

    // Privacy assertion
    assert(!receivedBridgeRequest.text.includes('+919999999999'), 'Guest phone number stripped from notification');
    assert(!receivedBridgeRequest.text.includes('suyash@vibe.fyi'), 'Raw email domain stripped');
    console.log('✅ [PASS] Outbound message formatting & privacy assertions verified');

    // -------------------------------------------------------------
    // TEST 3: Quoted Reply Resolution via External Message ID
    // -------------------------------------------------------------
    console.log('\n--- Step 3: Quoted Message ID Resolution ---');
    const resolvedConv = await conversationService.resolveConversationByQuotedMessage('wamid.HBgMTEST998877');
    assert(resolvedConv !== null, 'Found conversation by quoted message ID');
    assert(resolvedConv?.id === conv.id, 'Resolved to the exact matching conversation');
    console.log('✅ [PASS] resolveConversationByQuotedMessage accurately maps to guest conversation');

    // -------------------------------------------------------------
    // TEST 4: Host Replies via WhatsApp Bridge Webhook
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Host Replies in WhatsApp (Inbound Webhook) ---');
    const webhookPayload = {
      messageId: 'wa-reply-msg-001',
      senderPhone: '919876543210',
      senderName: 'Priya (Host)',
      text: 'Yes! Parking is free inside Gate 2.',
      quotedMessageId: 'wamid.HBgMTEST998877',
      conversationId: conv.id,
    };

    const incoming = await whatsappAdapter.processIncomingMessage(webhookPayload);
    assert(incoming !== null, 'Incoming message processed by adapter');
    assert(incoming?.messageContent === 'Yes! Parking is free inside Gate 2.', 'Content parsed cleanly');
    assert(incoming?.senderRole === 'HOST', 'Sender identified as HOST');

    const hostMsg = await conversationService.postHostMessage({
      conversationId: conv.id,
      senderId: 'whatsapp-host',
      content: incoming!.messageContent,
      channel: 'WHATSAPP',
      externalMessageId: incoming!.externalMessageId,
    });

    assert(hostMsg.id, 'Host message stored');
    assert(hostMsg.sender_role === 'HOST', 'Sender role is HOST');
    assert(hostMsg.channel === 'WHATSAPP', 'Channel is WHATSAPP');

    // Check message history for guest
    const messages = await conversationService.getConversationMessages(conv.id);
    assert(messages.length === 2, 'History contains 2 messages (guest inquiry + host reply)');
    assert(messages[1].content === 'Yes! Parking is free inside Gate 2.', 'Guest sees host reply');
    console.log('✅ [PASS] Host reply arrived safely in guest conversation history');

    // -------------------------------------------------------------
    // TEST 5: Webhook Deduplication / Idempotency
    // -------------------------------------------------------------
    console.log('\n--- Step 5: Webhook Deduplication ---');
    const duplicateIncoming = await whatsappAdapter.processIncomingMessage(webhookPayload);
    assert(duplicateIncoming?.isDuplicate === true, 'Repeated message ID flagged as duplicate');

    const deduplicatedHostMsg = await conversationService.postHostMessage({
      conversationId: conv.id,
      senderId: 'whatsapp-host',
      content: incoming!.messageContent,
      channel: 'WHATSAPP',
      externalMessageId: 'wa-reply-msg-001',
    });

    assert(deduplicatedHostMsg.id === hostMsg.id, 'Returned existing message ID on retry');
    const messagesAfterRetry = await conversationService.getConversationMessages(conv.id);
    assert(messagesAfterRetry.length === 2, 'Message count remains 2 (zero duplicates)');
    console.log('✅ [PASS] Webhook retry idempotency guaranteed');

    // -------------------------------------------------------------
    // TEST 6: Webhook Secret Verification
    // -------------------------------------------------------------
    console.log('\n--- Step 6: Webhook Secret Verification ---');
    const validReq = {
      headers: {
        'x-whatsapp-webhook-secret': 'vibe_wa_sec_test_token_123',
      },
    };
    const invalidReq = {
      headers: {
        'x-whatsapp-webhook-secret': 'wrong_secret',
      },
    };
    const missingReq = {
      headers: {},
    };

    assert(whatsappAdapter.verifyWebhook(validReq) === true, 'Accepts valid secret');
    assert(whatsappAdapter.verifyWebhook(invalidReq) === false, 'Rejects wrong secret');
    assert(whatsappAdapter.verifyWebhook(missingReq) === false, 'Rejects missing secret');
    console.log('✅ [PASS] Webhook secret authentication verified');

    // -------------------------------------------------------------
    // TEST 7: Unmapped Quoted Message Safety (Never Guess)
    // -------------------------------------------------------------
    console.log('\n--- Step 7: Unmapped Quoted Message Safety ---');
    const unmapped = await conversationService.resolveConversationByQuotedMessage('random-unknown-stanza-id');
    assert(unmapped === null, 'Returns null for unknown quoted message ID without guessing');
    console.log('✅ [PASS] Unmapped message handled safely without guessing conversations');

    console.log('\n===============================================================');
    console.log('🎉 ALL WHATSAPP INTEGRATION TESTS PASSED CLEANLY (100%)!');
    console.log('===============================================================');
  } finally {
    await new Promise<void>((resolve) => mockBridgeServer.close(() => resolve()));
  }
}

runWhatsAppTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
